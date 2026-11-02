import { Router } from 'express';
import { randomUUID } from 'crypto';
import db from '../db';
import { requireRole } from '../auth';
import { toWithdrawal } from '../serialize';
import { notifyUser } from '../notifications';
import { audit } from '../audit';

const router = Router();

// Vendor balances are derived from the immutable ledger.
function getVendorIdFromUser(userId:string){return (db.prepare('SELECT id FROM vendors WHERE user_id=?').get(userId) as any)?.id||null;}
function computeVendorLedgerBalance(vendorId:string){const row=db.prepare("SELECT COALESCE(SUM(CASE WHEN direction='credit' THEN amount ELSE -amount END),0) balance FROM vendor_ledger WHERE vendor_id=?").get(vendorId) as any;return Number(row?.balance||0);}
function computeWithdrawnOrHeld(vendorId:string){const row=db.prepare("SELECT COALESCE(SUM(amount),0) total FROM withdrawals WHERE vendor_id=? AND status IN ('Pending','Approved','Paid')").get(vendorId) as any;return Number(row?.total||0);}
router.get('/balance',requireRole('vendor'),(req,res)=>{const vendorId=getVendorIdFromUser(req.auth!.id);if(!vendorId)return res.status(404).json({error:'Vendor profile not found'});const v=db.prepare('SELECT kyc_status,account_status,store_status,payout_status FROM vendors WHERE id=?').get(vendorId) as any;const ledgerBalance=computeVendorLedgerBalance(vendorId);const held=computeWithdrawnOrHeld(vendorId);res.json({ledgerBalance,alreadyWithdrawnOrPending:held,availableBalance:Math.max(0,ledgerBalance-held),payoutEligible:v?.kyc_status==='Verified'&&v?.account_status==='Active'&&v?.store_status==='Active'&&v?.payout_status==='Active',kycStatus:v?.kyc_status,payoutStatus:v?.payout_status});});

// GET /api/withdrawals/mine  (vendor) — this vendor's own request history.
router.get('/mine', requireRole('vendor'), (req, res) => {
  const rows = db.prepare(
    'SELECT * FROM withdrawals WHERE vendor_id = ? ORDER BY requested_at DESC'
  ).all(getVendorIdFromUser(req.auth!.id));
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

  const vendorId = getVendorIdFromUser(req.auth!.id);
  if (!vendorId) return res.status(404).json({ error:'Vendor profile not found' });
  const vendor = db.prepare('SELECT kyc_status, account_status, store_status, payout_status FROM vendors WHERE id=?').get(vendorId) as any;
  if (vendor.kyc_status !== 'Verified') return res.status(403).json({ error:'KYC verification is required before withdrawals.' });
  if (vendor.account_status !== 'Active' || vendor.store_status !== 'Active') return res.status(403).json({ error:'Your vendor account/store is not active.' });
  if (vendor.payout_status !== 'Active') return res.status(403).json({ error:'Payouts are currently on hold for this vendor account.' });
  const available = Math.max(0, computeVendorLedgerBalance(vendorId) - computeWithdrawnOrHeld(vendorId));

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

  if (status === 'Paid' && existing.status !== 'Approved') return res.status(409).json({ error: 'Only an Approved withdrawal can be marked Paid' });
  if (status === 'Approved' && existing.status === 'Paid') return res.status(409).json({ error: 'A paid withdrawal cannot be approved again' });
  db.prepare(
    `UPDATE withdrawals SET status = ?, notes = ?, processed_at = datetime('now'), processed_by = ? WHERE id = ?`
  ).run(status, notes ?? existing.notes, req.auth!.id, req.params.id);
  if (status === 'Paid') {
    db.prepare(`INSERT OR IGNORE INTO vendor_ledger(id,vendor_id,order_id,vendor_order_id,entry_type,direction,amount,description) VALUES(?,?,?,?,?,?,?,?)`).run(`LED-WD-${existing.id}`,existing.vendor_id,null,null,'Withdrawal','debit',existing.amount,`Withdrawal ${existing.id} paid`);
  }
  const owner = db.prepare('SELECT user_id FROM vendors WHERE id=?').get(existing.vendor_id) as any;
  audit(req,'withdrawal.status.update','withdrawal',existing.id,{status,amount:existing.amount});
  notifyUser(owner?.user_id, `Withdrawal ${status}`, `Your withdrawal ${existing.id} is now ${status.toLowerCase()}.`, 'payout', { withdrawalId: existing.id });

  const row = db.prepare(
    `SELECT w.*, v.name AS vendor_name, v.email AS vendor_email
     FROM withdrawals w JOIN vendors v ON v.id = w.vendor_id WHERE w.id = ?`
  ).get(req.params.id);
  res.json(toWithdrawal(row));
});

export default router;
