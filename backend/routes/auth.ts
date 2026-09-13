import { Router } from 'express';
import { randomUUID } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import db from '../db';
import { hashPassword, verifyPassword, signToken, requireAuth, requireRole } from '../auth';

const router = Router();
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

function userSession(row: any) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    avatar: row.avatar,
    provider: 'local' as const,
    role: row.role,
  };
}

// GET /api/auth/google/config — the client id is safe to expose to the
// browser; it identifies the app to Google, it isn't a secret.
router.get('/google/config', (_req, res) => {
  res.json({ configured: Boolean(GOOGLE_CLIENT_ID), clientId: GOOGLE_CLIENT_ID || null });
});

// POST /api/auth/google  { idToken, role? }
//
// idToken is the credential Google's Sign-In button hands back to the
// frontend. It's verified here, server-side, against Google's own public
// keys — the frontend never gets to just assert "this is who I am."
// If no account exists yet for this email, one is created automatically
// (auth_provider: 'google'), matching the email/password signup flow but
// skipping the password step entirely.
router.post('/google', async (req, res) => {
  const { idToken, role } = req.body || {};
  if (!idToken) {
    return res.status(400).json({ error: 'idToken is required' });
  }
  if (!GOOGLE_CLIENT_ID) {
    return res.status(503).json({ error: 'Google Sign-In is not configured on this server (missing GOOGLE_CLIENT_ID).' });
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
    payload = ticket.getPayload();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid Google credential.' });
  }
  if (!payload || !payload.email) {
    return res.status(401).json({ error: 'Google did not return a verified email for this account.' });
  }
  if (!payload.email_verified) {
    return res.status(401).json({ error: 'This Google account\'s email is not verified.' });
  }

  const cleanEmail = payload.email.trim().toLowerCase();
  let row = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail) as any;

  if (!row) {
    const finalRole = role === 'vendor' ? 'vendor' : 'buyer';
    const id = randomUUID();
    // Google accounts don't set a local password; store an unusable random
    // hash so the NOT NULL column is satisfied and the value can never be
    // guessed or used to log in through the local email/password flow.
    db.prepare(
      `INSERT INTO users (id, name, email, phone, password_hash, role, avatar, auth_provider) VALUES (?, ?, ?, ?, ?, ?, ?, 'google')`
    ).run(id, payload.name || cleanEmail.split('@')[0], cleanEmail, null, hashPassword(randomUUID()), finalRole, payload.picture || null);

    if (finalRole === 'vendor') {
      db.prepare(
        `INSERT INTO vendors (id, user_id, name, email, phone, status, store_category) VALUES (?, ?, ?, ?, ?, 'Pending', ?)`
      ).run(randomUUID(), id, payload.name || cleanEmail, cleanEmail, null, 'General');
    }
    row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
  }

  if (row.status === 'Suspended') {
    return res.status(403).json({ error: 'This account has been suspended. Contact compliance@tradeease.ng' });
  }

  const token = signToken({ id: row.id, email: row.email, role: row.role });
  res.json({ token, user: userSession(row) });
});

// POST /api/auth/register  { name, email, phone, password, role }
router.post('/register', (req, res) => {
  const { name, email, phone, password, role } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email and password are required' });
  }
  const cleanEmail = String(email).trim().toLowerCase();
  const finalRole = role === 'vendor' ? 'vendor' : 'buyer';

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const id = randomUUID();
  const avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
  db.prepare(
    `INSERT INTO users (id, name, email, phone, password_hash, role, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, name, cleanEmail, phone || null, hashPassword(password), finalRole, avatar);

  // If registering as a vendor, also create a vendor storefront record awaiting approval.
  if (finalRole === 'vendor') {
    db.prepare(
      `INSERT INTO vendors (id, user_id, name, email, phone, status, store_category) VALUES (?, ?, ?, ?, ?, 'Pending', ?)`
    ).run(randomUUID(), id, name, cleanEmail, phone || null, 'General');
  }

  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
  const token = signToken({ id: row.id, email: row.email, role: row.role });
  res.status(201).json({ token, user: userSession(row) });
});

// POST /api/auth/login  { email, password }
router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  const cleanEmail = String(email).trim().toLowerCase();
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail) as any;
  if (!row || !verifyPassword(password, row.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  if (row.status === 'Suspended') {
    return res.status(403).json({ error: 'This account has been suspended. Contact compliance@tradeease.ng' });
  }
  const token = signToken({ id: row.id, email: row.email, role: row.role });
  res.json({ token, user: userSession(row) });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.auth!.id) as any;
  if (!row) return res.status(404).json({ error: 'User not found' });
  res.json({ user: userSession(row) });
});

// POST /api/auth/admin-login  { email, password }
router.post('/admin-login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  const cleanEmail = String(email).trim().toLowerCase();
  const row = db.prepare('SELECT * FROM admins WHERE email = ?').get(cleanEmail) as any;
  if (!row || !verifyPassword(password, row.password_hash)) {
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }
  const token = signToken({ id: row.id, email: row.email, role: 'admin' });
  res.json({
    token,
    admin: { id: row.id, name: row.name, level: row.level, email: row.email, phone: row.phone },
  });
});

// ---------- Admin team management ----------

// GET /api/auth/admins — the whole admin backoffice team (admin only).
router.get('/admins', requireRole('admin'), (req, res) => {
  const rows = db.prepare('SELECT * FROM admins ORDER BY created_at DESC').all() as any[];
  res.json(rows.map((r) => ({ id: r.id, name: r.name, email: r.email, level: r.level, phone: r.phone, createdAt: r.created_at })));
});

// POST /api/auth/admins  { name, email, password, level, phone } — an
// existing admin invites a new one onto the backoffice team.
router.post('/admins', requireRole('admin'), (req, res) => {
  const { name, email, password, level, phone } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email and password are required' });
  }
  const cleanEmail = String(email).trim().toLowerCase();
  const existing = db.prepare('SELECT id FROM admins WHERE email = ?').get(cleanEmail);
  if (existing) return res.status(409).json({ error: 'An admin account with this email already exists' });

  const id = randomUUID();
  db.prepare(
    `INSERT INTO admins (id, name, email, password_hash, level, phone) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, name, cleanEmail, hashPassword(password), level || 'Admin', phone || null);

  const row = db.prepare('SELECT * FROM admins WHERE id = ?').get(id) as any;
  res.status(201).json({ id: row.id, name: row.name, email: row.email, level: row.level, phone: row.phone, createdAt: row.created_at });
});

// DELETE /api/auth/admins/:id — remove a teammate. An admin can't remove
// their own account through this endpoint, to avoid ever leaving the
// backoffice with zero admins able to log in.
router.delete('/admins/:id', requireRole('admin'), (req, res) => {
  if (req.auth!.id === req.params.id) {
    return res.status(400).json({ error: 'You cannot remove your own admin account.' });
  }
  const remaining = (db.prepare('SELECT COUNT(*) as c FROM admins').get() as any).c;
  if (remaining <= 1) {
    return res.status(400).json({ error: 'Cannot remove the last remaining admin account.' });
  }
  db.prepare('DELETE FROM admins WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// PUT /api/auth/admin/me  { name, phone } — an admin updates their own profile.
router.put('/admin/me', requireRole('admin'), (req, res) => {
  const { name, phone } = req.body || {};
  const existing = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.auth!.id) as any;
  if (!existing) return res.status(404).json({ error: 'Admin account not found' });

  db.prepare('UPDATE admins SET name = ?, phone = ? WHERE id = ?').run(
    name?.trim() || existing.name,
    phone ?? existing.phone,
    req.auth!.id
  );
  const row = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.auth!.id) as any;
  res.json({ id: row.id, name: row.name, email: row.email, level: row.level, phone: row.phone, createdAt: row.created_at });
});

export default router;
