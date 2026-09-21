import { Router } from 'express';
import { randomInt } from 'crypto';
import db from '../db';
import { requireAuth, verifyPassword, hashPassword } from '../auth';
import { toProduct, toOrder } from '../serialize';
import { uploadAvatar, avatarUrlFor } from '../uploadAvatar';
import { generateTotpSetup, verifyTotpCode } from '../totp';

const router = Router();

function toSelfProfile(row: any) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    avatar: row.avatar,
    emailVerified: !!row.email_verified,
    totpEnabled: !!row.totp_enabled,
  };
}

/**
 * PUT /api/account/profile  { name?, phone? }
 * Updates the logged-in buyer/vendor's own name and/or phone number.
 */
router.put('/profile', requireAuth, (req, res) => {
  const { name, phone } = req.body || {};
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(req.auth!.id) as any;
  if (!existing) return res.status(404).json({ error: 'Account not found' });

  db.prepare('UPDATE users SET name = ?, phone = ? WHERE id = ?').run(
    name?.trim() || existing.name,
    phone ?? existing.phone,
    req.auth!.id
  );
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.auth!.id) as any;
  res.json(toSelfProfile(row));
});

/**
 * PUT /api/account/password  { currentPassword, newPassword }
 * Changes the logged-in buyer/vendor's password. Requires the current one.
 */
router.put('/password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!newPassword || String(newPassword).length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  }
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(req.auth!.id) as any;
  if (!existing) return res.status(404).json({ error: 'Account not found' });

  if (existing.auth_provider === 'google') {
    return res.status(400).json({ error: 'This account signs in with Google and has no TradeEase password to change.' });
  }
  if (!currentPassword || !verifyPassword(currentPassword, existing.password_hash)) {
    return res.status(401).json({ error: 'Current password is incorrect.' });
  }

  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(newPassword), req.auth!.id);
  res.json({ success: true });
});

/**
 * POST /api/account/avatar  (multipart/form-data, field name "avatar")
 * Uploads and sets the logged-in buyer/vendor's profile picture.
 */
router.post('/avatar', requireAuth, uploadAvatar.single('avatar'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image file was uploaded.' });
  const url = avatarUrlFor(req.file.filename);
  db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(url, req.auth!.id);
  res.json({ avatar: url });
});

/**
 * POST /api/account/logo  (multipart/form-data, field name "logo")  — vendor only
 * Uploads and sets the vendor's store brand image (separate from their
 * personal profile picture).
 */
router.post('/logo', requireAuth, uploadAvatar.single('logo'), (req, res) => {
  if (req.auth!.role !== 'vendor') return res.status(403).json({ error: 'Only vendor accounts have a store logo.' });
  if (!req.file) return res.status(400).json({ error: 'No image file was uploaded.' });
  const vendor = db.prepare('SELECT id FROM vendors WHERE user_id = ?').get(req.auth!.id) as any;
  if (!vendor) return res.status(404).json({ error: 'No vendor store found for this account.' });
  const url = avatarUrlFor(req.file.filename);
  db.prepare('UPDATE vendors SET logo = ? WHERE id = ?').run(url, vendor.id);
  res.json({ logo: url });
});

// Sends (or, without an email provider configured, logs) a 6-digit
// verification code. See sendEmail() below for how delivery actually works.
async function sendEmail(to: string, subject: string, body: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // No email provider configured — log it server-side so it can still be
    // retrieved manually (e.g. from Railway's deploy logs) during testing.
    console.log(`[email not sent — no RESEND_API_KEY configured] To: ${to} | Subject: ${subject} | ${body}`);
    return false;
  }
  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'TradeEase <onboarding@resend.dev>',
        to,
        subject,
        text: body,
      }),
    });
    return resp.ok;
  } catch {
    return false;
  }
}

/**
 * POST /api/account/verify-email/request
 * Generates a 6-digit code, valid for 15 minutes, and emails it (if an
 * email provider is configured — see sendEmail above).
 */
router.post('/verify-email/request', requireAuth, async (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.auth!.id) as any;
  if (!user) return res.status(404).json({ error: 'Account not found' });
  if (user.email_verified) return res.json({ alreadyVerified: true });

  const code = String(randomInt(100000, 1000000));
  const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  db.prepare('UPDATE users SET email_verification_code = ?, email_verification_expires = ? WHERE id = ?').run(code, expires, user.id);

  const delivered = await sendEmail(user.email, 'Verify your TradeEase email', `Your verification code is ${code}. It expires in 15 minutes.`);
  res.json({ sent: true, delivered });
});

/**
 * POST /api/account/verify-email/confirm  { code }
 */
router.post('/verify-email/confirm', requireAuth, (req, res) => {
  const { code } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.auth!.id) as any;
  if (!user) return res.status(404).json({ error: 'Account not found' });
  if (user.email_verified) return res.json({ verified: true });

  if (!user.email_verification_code || !code || String(code).trim() !== user.email_verification_code) {
    return res.status(400).json({ error: 'Incorrect verification code.' });
  }
  if (!user.email_verification_expires || new Date(user.email_verification_expires) < new Date()) {
    return res.status(400).json({ error: 'This code has expired. Request a new one.' });
  }

  db.prepare('UPDATE users SET email_verified = 1, email_verification_code = NULL, email_verification_expires = NULL WHERE id = ?').run(user.id);
  res.json({ verified: true });
});

/**
 * POST /api/account/2fa/setup
 * Generates a new TOTP secret + QR code for the logged-in user to scan
 * with Google Authenticator (or similar). Not enabled yet — the secret is
 * stored, but 2FA only actually turns on once they confirm a valid code
 * via /2fa/enable, proving they scanned it correctly.
 */
router.post('/2fa/setup', requireAuth, async (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.auth!.id) as any;
  if (!user) return res.status(404).json({ error: 'Account not found' });

  const { secretBase32, qrCodeDataUrl } = await generateTotpSetup(user.email);
  db.prepare('UPDATE users SET totp_secret = ?, totp_enabled = 0 WHERE id = ?').run(secretBase32, user.id);
  res.json({ secret: secretBase32, qrCodeDataUrl });
});

/**
 * POST /api/account/2fa/enable  { code }
 * Confirms the 6-digit code from the authenticator app and turns 2FA on.
 */
router.post('/2fa/enable', requireAuth, (req, res) => {
  const { code } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.auth!.id) as any;
  if (!user || !user.totp_secret) return res.status(400).json({ error: 'Start 2FA setup first.' });

  if (!verifyTotpCode(user.totp_secret, code)) {
    return res.status(400).json({ error: 'Incorrect code. Check your authenticator app and try again.' });
  }
  db.prepare('UPDATE users SET totp_enabled = 1 WHERE id = ?').run(user.id);
  res.json({ enabled: true });
});

/**
 * POST /api/account/2fa/disable  { password }
 * Turns 2FA off. Requires the current password as confirmation.
 */
router.post('/2fa/disable', requireAuth, (req, res) => {
  const { password } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.auth!.id) as any;
  if (!user) return res.status(404).json({ error: 'Account not found' });
  if (!password || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'Incorrect password.' });
  }
  db.prepare('UPDATE users SET totp_enabled = 0, totp_secret = NULL WHERE id = ?').run(user.id);
  res.json({ enabled: false });
});

/**
 * GET /api/account/export
 *
 * Returns everything TradeEase holds about the logged-in person as a single
 * JSON document: their profile, every order they've placed, and — if
 * they're a vendor — their storefront and product listings. The frontend
 * turns this into a downloadable file; this endpoint just assembles the data.
 */
router.get('/export', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.auth!.id) as any;
  if (!user) return res.status(404).json({ error: 'Account not found' });

  const profile = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    totalOrders: user.total_orders,
    totalSpent: user.total_spent,
    accountCreated: user.created_at,
  };

  const orderRows = db.prepare('SELECT * FROM orders WHERE buyer_id = ? ORDER BY date DESC').all(user.id) as any[];
  const orders = orderRows.map((o) => {
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id);
    return toOrder(o, items);
  });

  let vendorProfile: any = null;
  let products: any[] = [];
  const vendorRow = db.prepare('SELECT * FROM vendors WHERE user_id = ?').get(user.id) as any;
  if (vendorRow) {
    vendorProfile = {
      id: vendorRow.id,
      name: vendorRow.name,
      email: vendorRow.email,
      phone: vendorRow.phone,
      status: vendorRow.status,
      storeCategory: vendorRow.store_category,
      joiningDate: vendorRow.joining_date,
    };
    const productRows = db.prepare('SELECT * FROM products WHERE vendor_id = ?').all(vendorRow.id);
    products = productRows.map(toProduct);
  }

  const supportMessages = db
    .prepare(
      `SELECT sc.id as chatId, sm.sender, sm.content, sm.timestamp
       FROM support_chats sc JOIN support_messages sm ON sm.chat_id = sc.id
       WHERE lower(sc.user_email) = lower(?) ORDER BY sm.timestamp ASC`
    )
    .all(user.email);

  res.json({
    exportedAt: new Date().toISOString(),
    platform: 'TradeEase',
    profile,
    orders,
    vendorProfile,
    products,
    supportMessages,
  });
});

/**
 * DELETE /api/account  { password }
 *
 * Permanently deletes the logged-in person's account and everything tied to
 * it: their orders, their vendor storefront and product listings (if any),
 * and their support chat history. Requires the current password as
 * confirmation, since this can't be undone.
 */
router.delete('/', requireAuth, (req, res) => {
  const { password } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.auth!.id) as any;
  if (!user) return res.status(404).json({ error: 'Account not found' });

  if (!password || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'Incorrect password. Enter your current password to confirm account deletion.' });
  }

  const tx = db.transaction(() => {
    const vendorRow = db.prepare('SELECT id FROM vendors WHERE user_id = ?').get(user.id) as any;
    if (vendorRow) {
      db.prepare('DELETE FROM products WHERE vendor_id = ?').run(vendorRow.id);
      db.prepare('DELETE FROM vendors WHERE id = ?').run(vendorRow.id);
    }
    // order_items cascade automatically when their parent order is deleted (schema FK).
    db.prepare('DELETE FROM orders WHERE buyer_id = ?').run(user.id);

    // support_messages cascade automatically when their parent chat is deleted (schema FK).
    db.prepare('DELETE FROM support_chats WHERE lower(user_email) = lower(?)').run(user.email);

    db.prepare('DELETE FROM users WHERE id = ?').run(user.id);
  });
  tx();

  res.json({ success: true, message: 'Your TradeEase account and all associated data have been permanently deleted.' });
});

export default router;
