import { Router } from 'express';
import db from '../db';
import { requireAuth, verifyPassword } from '../auth';
import { toProduct, toOrder } from '../serialize';

const router = Router();

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
