import 'dotenv/config';
import { Router } from 'express';
import { randomUUID, randomInt } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import db from '../db';
import { hashPassword, verifyPassword, signToken, requireAuth, requireRole, requireAdminLevel } from '../auth';
import { uploadAvatar, avatarUrlFor } from '../uploadAvatar';
import { generateTotpSetup, verifyTotpCode } from '../totp';

const router = Router();

// Lightweight brute-force protection for a single-process deployment.
// Production deployments should still add edge/WAF rate limiting as well.
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 8;
function loginRateLimit(req: any, res: any, next: any) {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const key = `${req.ip}:${email}`;
  const now = Date.now();
  const current = loginAttempts.get(key);
  if (!current || current.resetAt <= now) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return next();
  }
  if (current.count >= MAX_LOGIN_ATTEMPTS) {
    return res.status(429).json({ error: 'Too many login attempts. Please try again later.' });
  }
  current.count += 1;
  next();
}

export function validatePassword(password: unknown): string | null {
  if (typeof password !== 'string' || password.length < 10) return 'Password must be at least 10 characters long';
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Password must contain uppercase, lowercase, and a number';
  }
  return null;
}
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
  const passwordError = validatePassword(password);
  if (passwordError) return res.status(400).json({ error: passwordError });
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
router.post('/login', loginRateLimit, (req, res) => {
  const { email, password, totpCode } = req.body || {};
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
  if (row.totp_enabled) {
    // Password alone isn't enough for this account — the client needs to
    // prompt for the 6-digit authenticator code and resubmit this same
    // request with totpCode included. This isn't an error response (still
    // 200) since the password itself was correct; it's an additional step.
    if (!totpCode) {
      return res.json({ requiresTotp: true });
    }
    if (!verifyTotpCode(row.totp_secret, totpCode)) {
      return res.status(401).json({ error: 'Incorrect authenticator code.' });
    }
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
router.post('/admin-login', loginRateLimit, (req, res) => {
  const { email, password, totpCode } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  const cleanEmail = String(email).trim().toLowerCase();
  const row = db.prepare('SELECT * FROM admins WHERE email = ?').get(cleanEmail) as any;
  if (!row || !verifyPassword(password, row.password_hash)) {
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }
  if (row.totp_enabled) {
    if (!totpCode) {
      return res.json({ requiresTotp: true });
    }
    if (!verifyTotpCode(row.totp_secret, totpCode)) {
      return res.status(401).json({ error: 'Incorrect authenticator code.' });
    }
  }
  const token = signToken({ id: row.id, email: row.email, role: 'admin', level: row.level });
  res.json({
    token,
    admin: { id: row.id, name: row.name, level: row.level, email: row.email, phone: row.phone, avatar: row.avatar, totpEnabled: !!row.totp_enabled },
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
router.post('/admins', requireAdminLevel(), (req, res) => {
  const { name, email, password, level, phone } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email and password are required' });
  }
  const passwordError = validatePassword(password);
  if (passwordError) return res.status(400).json({ error: passwordError });
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
router.delete('/admins/:id', requireAdminLevel(), (req, res) => {
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
  res.json({ id: row.id, name: row.name, email: row.email, level: row.level, phone: row.phone, avatar: row.avatar, totpEnabled: !!row.totp_enabled, createdAt: row.created_at });
});

// PUT /api/auth/admin/password  { currentPassword, newPassword }
router.put('/admin/password', requireRole('admin'), (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!newPassword || String(newPassword).length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  }
  const existing = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.auth!.id) as any;
  if (!existing) return res.status(404).json({ error: 'Admin account not found' });
  if (!currentPassword || !verifyPassword(currentPassword, existing.password_hash)) {
    return res.status(401).json({ error: 'Current password is incorrect.' });
  }
  db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(hashPassword(newPassword), req.auth!.id);
  res.json({ success: true });
});

// POST /api/auth/admin/avatar  (multipart/form-data, field name "avatar")
router.post('/admin/avatar', requireRole('admin'), uploadAvatar.single('avatar'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image file was uploaded.' });
  const url = avatarUrlFor(req.file.filename);
  db.prepare('UPDATE admins SET avatar = ? WHERE id = ?').run(url, req.auth!.id);
  res.json({ avatar: url });
});

// POST /api/auth/admin/2fa/setup
router.post('/admin/2fa/setup', requireRole('admin'), async (req, res) => {
  const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.auth!.id) as any;
  if (!admin) return res.status(404).json({ error: 'Admin account not found' });
  const { secretBase32, qrCodeDataUrl } = await generateTotpSetup(admin.email);
  db.prepare('UPDATE admins SET totp_secret = ?, totp_enabled = 0 WHERE id = ?').run(secretBase32, admin.id);
  res.json({ secret: secretBase32, qrCodeDataUrl });
});

// POST /api/auth/admin/2fa/enable  { code }
router.post('/admin/2fa/enable', requireRole('admin'), (req, res) => {
  const { code } = req.body || {};
  const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.auth!.id) as any;
  if (!admin || !admin.totp_secret) return res.status(400).json({ error: 'Start 2FA setup first.' });
  if (!verifyTotpCode(admin.totp_secret, code)) {
    return res.status(400).json({ error: 'Incorrect code. Check your authenticator app and try again.' });
  }
  db.prepare('UPDATE admins SET totp_enabled = 1 WHERE id = ?').run(admin.id);
  res.json({ enabled: true });
});

// POST /api/auth/admin/2fa/disable  { password }
router.post('/admin/2fa/disable', requireRole('admin'), (req, res) => {
  const { password } = req.body || {};
  const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.auth!.id) as any;
  if (!admin) return res.status(404).json({ error: 'Admin account not found' });
  if (!password || !verifyPassword(password, admin.password_hash)) {
    return res.status(401).json({ error: 'Incorrect password.' });
  }
  db.prepare('UPDATE admins SET totp_enabled = 0, totp_secret = NULL WHERE id = ?').run(admin.id);
  res.json({ enabled: false });
});

export default router;
