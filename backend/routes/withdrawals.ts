import { Router } from 'express';
import { randomUUID } from 'crypto';
import db from '../db';
import { requireRole } from '../auth';
import { toWithdrawal } from '../serialize';

const router = Router();

// Computes a vendor's lifetime net earnings from delivered orders, using
// each product's own commission override if set, else the vendor's
// override, else the platform's global rate — in that order of priority.
function computeVendorGrossEarnings(vendorId: string): number {
  const platform = db.prepare('SELECT commission_percent FROM platform_settings WHERE id = 1').get() as any;
  const platformRate = platform?.commission_percent ?? 8;

  const vendor = db.prepare('SELECT commission_percent FROM vendors WHERE id = ?').get(vendorId) as any;
  const vendorRate = vendor?.commission_percent;

  const rows = db.prepare(
    `SELECT oi.price, oi.quantity, p.commission_percent AS product_rate
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     JOIN products p ON p.id = oi.product_id
     WHERE o.status = 'Delivered' AND p.vendor_id = ?`
  ).all(vendorId) as any[];

  let earnings = 0;
  for (const row of rows) {
    const rate = row.product_rate ?? vendorRate ?? platformRate;
    const gross = row.price * row.quantity;
    earnings += gross * (1 - rate / 100);
  }
  return earnings;
}

// Withdrawals that still count against the vendor's balance — a Pending or
// Approved request has "claimed" that money already, even before it's
// marked Paid. Only Rejected requests release the amount back.
function computeWithdrawnOrHeld(vendorId: string): number {
  const row = db.prepare(
    `SELECT COALESCE(SUM(amount), 0) AS total FROM withdrawals
     WHERE vendor_id = ? AND status IN ('Pending', 'Approved', 'Paid')`
  ).get(vendorId) as any;
  return row?.total ?? 0;
}

// GET /api/withdrawals/balance  (vendor) — this vendor's current
// withdrawable balance.
router.get('/balance', requireRole('vendor'), (req, res) => {
  const vendorId = req.auth!.id;
  const gross = computeVendorGrossEarnings(vendorId);
  const held = computeWithdrawnOrHeld(vendorId);
  const available = Math.max(0, gross - held);
  res.json({ grossEarnings: gross, alreadyWithdrawnOrPending: held, availableBalance: available });
});

// GET /api/withdrawals/mine  (vendor) — this vendor's own request history.
router.get('/mine', requireRole('vendor'), (req, res) => {
  const rows = db.prepare(
    'SELECT * FROM withdrawals WHERE vendor_id = ? ORDER BY requested_at DESC'
  ).all(req.auth!.id);
  res.json(rows.map(toWithdrawal));
});

// POST /api/withdrawals  (vendor) — request a withdrawal of some or all of
// the available balance.
router.post('/', requireRole('vendor'), (req, res) => {
  const b = req.body || {};
  const amount = Number(b.amount);
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'A withdrawal amount greater than zero is required' });
  }
  if (!b.bankName || !b.accountNumber || !b.accountName) {
    return res.status(400).json({ error: 'Bank name, account number, and account name are required' });
  }

  const vendorId = req.auth!.id;
  const gross = computeVendorGrossEarnings(vendorId);
  const held = computeWithdrawnOrHeld(vendorId);
  const available = Math.max(0, gross - held);

  if (amount > available) {
    return res.status(400).json({ error: `Amount exceeds your available balance of ${available.toFixed(2)}` });
  }

  const id = `WD-${randomUUID().slice(0, 8).toUpperCase()}`;
  db.prepare(
    `INSERT INTO withdrawals (id, vendor_id, amount, status, bank_name, account_number, account_name)
     VALUES (?, ?, ?, 'Pending', ?, ?, ?)`
  ).run(id, vendorId, amount, b.bankName, b.accountNumber, b.accountName);

  const row = db.prepare('SELECT * FROM withdrawals WHERE id = ?').get(id);
  res.status(201).json(toWithdrawal(row));
});

// GET /api/withdrawals  (admin) — every vendor's requests, most recent
// first, with the vendor's name attached for display.
router.get('/', requireRole('admin'), (_req, res) => {
  const rows = db.prepare(
    `SELECT w.*, v.name AS vendor_name, v.email AS vendor_email
     FROM withdrawals w
     JOIN vendors v ON v.id = w.vendor_id
     ORDER BY w.requested_at DESC`
  ).all();
  res.json(rows.map(toWithdrawal));
});

// PUT /api/withdrawals/:id/status  (admin) — approve, reject, or mark paid.
router.put('/:id/status', requireRole('admin'), (req, res) => {
  const { status, notes } = req.body || {};
  if (!['Approved', 'Rejected', 'Paid'].includes(status)) {
    return res.status(400).json({ error: 'status must be Approved, Rejected, or Paid' });
  }
  const existing = db.prepare('SELECT * FROM withdrawals WHERE id = ?').get(req.params.id) as any;
  if (!existing) return res.status(404).json({ error: 'Withdrawal request not found' });

  db.prepare(
    `UPDATE withdrawals SET status = ?, notes = ?, processed_at = datetime('now'), processed_by = ? WHERE id = ?`
  ).run(status, notes ?? existing.notes, req.auth!.id, req.params.id);

  const row = db.prepare(
    `SELECT w.*, v.name AS vendor_name, v.email AS vendor_email
     FROM withdrawals w JOIN vendors v ON v.id = w.vendor_id WHERE w.id = ?`
  ).get(req.params.id);
  res.json(toWithdrawal(row));
});

export default router;
