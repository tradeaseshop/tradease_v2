import { Router } from 'express';
import crypto from 'crypto';
import db from '../db';
import { requireRole } from '../auth';
import { verifyTransaction, initializeTransaction, isPaystackConfigured } from '../paystackClient';

const router = Router();
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY || '';
const MIN_FUNDING_NAIRA = 100;
const MAX_FUNDING_NAIRA = 5_000_000;

function ensureWallet(userId: string) {
  db.prepare(`INSERT OR IGNORE INTO buyer_wallets(user_id,balance) VALUES(?,0)`).run(userId);
}

router.get('/', requireRole('buyer'), (req, res) => {
  ensureWallet(req.auth!.id);
  const wallet = db.prepare('SELECT balance,updated_at FROM buyer_wallets WHERE user_id=?').get(req.auth!.id) as any;
  const transactions = db.prepare(`
    SELECT id,type,direction,amount,status,provider,reference,description,created_at,completed_at
    FROM wallet_transactions WHERE user_id=? ORDER BY created_at DESC LIMIT 20
  `).all(req.auth!.id);
  res.json({
    balance: Number(wallet?.balance || 0),
    updatedAt: wallet?.updated_at || null,
    transactions,
  });
});

router.post('/fund/prepare', requireRole('buyer'), async (req, res) => {
  if (!isPaystackConfigured() || !PAYSTACK_PUBLIC_KEY) {
    return res.status(503).json({ error: 'Paystack payments are not configured yet.' });
  }
  const amount = Number(req.body?.amount);
  if (!Number.isFinite(amount) || amount < MIN_FUNDING_NAIRA || amount > MAX_FUNDING_NAIRA) {
    return res.status(400).json({ error: `Enter an amount between ₦${MIN_FUNDING_NAIRA.toLocaleString()} and ₦${MAX_FUNDING_NAIRA.toLocaleString()}.` });
  }
  const normalized = Math.round(amount * 100) / 100;
  const reference = `TE-WAL-${Date.now()}-${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
  const id = crypto.randomUUID();
  ensureWallet(req.auth!.id);
  db.prepare(`
    INSERT INTO wallet_transactions(id,user_id,type,direction,amount,status,provider,reference,description)
    VALUES(?,?,?,?,?,?,?,?,?)
  `).run(id, req.auth!.id, 'funding', 'credit', normalized, 'Pending', 'Paystack', reference, 'Buyer wallet funding');

  try {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const initialized = await initializeTransaction({
      email: req.auth!.email,
      amountNaira: normalized,
      reference,
      callbackUrl: `${baseUrl}/paystack/callback`,
    });
    db.prepare('UPDATE wallet_transactions SET metadata=? WHERE id=?').run(
      JSON.stringify({ paystackAccessCode: initialized.accessCode, authorizationUrl: initialized.authorizationUrl }),
      id,
    );
    return res.json({
      reference: initialized.reference,
      amount: normalized,
      currency: 'NGN',
      publicKey: PAYSTACK_PUBLIC_KEY,
      email: req.auth!.email,
      transactionId: id,
      authorizationUrl: initialized.authorizationUrl,
    });
  } catch (err: any) {
    db.prepare("UPDATE wallet_transactions SET status='Failed',metadata=? WHERE id=? AND status='Pending'").run(
      JSON.stringify({ initializationError: err?.message || 'Paystack initialization failed' }),
      id,
    );
    console.error('[wallet/paystack] initialization error:', err);
    return res.status(502).json({ error: err?.message || 'Could not start Paystack payment.' });
  }
});

router.post('/fund/verify', requireRole('buyer'), async (req, res) => {
  const reference = String(req.body?.reference || '').trim();
  if (!reference || reference.length > 150) return res.status(400).json({ error: 'A valid payment reference is required.' });

  const pending = db.prepare(`SELECT * FROM wallet_transactions WHERE reference=? AND user_id=? AND type='funding'`).get(reference, req.auth!.id) as any;
  if (!pending) return res.status(404).json({ error: 'Wallet funding transaction was not found.' });
  if (pending.status === 'Successful') {
    ensureWallet(req.auth!.id);
    const wallet = db.prepare('SELECT balance FROM buyer_wallets WHERE user_id=?').get(req.auth!.id) as any;
    return res.json({ verified: true, alreadyCredited: true, reference, amountNaira: Number(pending.amount), balance: Number(wallet?.balance || 0) });
  }

  try {
    const result = await verifyTransaction(reference);
    if (!result.verified || result.currency !== 'NGN') {
      db.prepare("UPDATE wallet_transactions SET status='Failed',metadata=? WHERE id=? AND status='Pending'").run(JSON.stringify({ paystackStatus: result.status }), pending.id);
      return res.status(402).json({ error: `Payment was not successful (status: ${result.status}).`, verified: false });
    }
    if (Math.round(result.amountNaira * 100) !== Math.round(Number(pending.amount) * 100)) {
      db.prepare("UPDATE wallet_transactions SET status='Failed',metadata=? WHERE id=? AND status='Pending'").run(JSON.stringify({ paystackAmount: result.amountNaira, expectedAmount: pending.amount }), pending.id);
      return res.status(402).json({ error: 'The amount paid does not match the wallet funding amount.', verified: false });
    }
    if (result.customerEmail && result.customerEmail.toLowerCase() !== req.auth!.email.toLowerCase()) {
      db.prepare("UPDATE wallet_transactions SET status='Failed',metadata=? WHERE id=? AND status='Pending'").run(JSON.stringify({ paystackEmail: result.customerEmail }), pending.id);
      return res.status(402).json({ error: 'The Paystack payment email does not match the signed-in TradeEase account.', verified: false });
    }

    const credit = db.transaction(() => {
      ensureWallet(req.auth!.id);
      const current = db.prepare('SELECT balance FROM buyer_wallets WHERE user_id=?').get(req.auth!.id) as any;
      const newBalance = Math.round((Number(current?.balance || 0) + Number(pending.amount)) * 100) / 100;
      const updated = db.prepare(`
        UPDATE wallet_transactions SET status='Successful',completed_at=?,metadata=? WHERE id=? AND status='Pending'
      `).run(result.paidAt || new Date().toISOString(), JSON.stringify({ paystackReference: result.reference, paidAt: result.paidAt }), pending.id);
      if (updated.changes !== 1) {
        const wallet = db.prepare('SELECT balance FROM buyer_wallets WHERE user_id=?').get(req.auth!.id) as any;
        return Number(wallet?.balance || 0);
      }
      db.prepare("UPDATE buyer_wallets SET balance=?,updated_at=datetime('now') WHERE user_id=?").run(newBalance, req.auth!.id);
      return newBalance;
    })();

    return res.json({ verified: true, reference: result.reference, amountNaira: Number(pending.amount), balance: credit, paidAt: result.paidAt });
  } catch (err: any) {
    console.error('[wallet/paystack] verification error:', err);
    return res.status(502).json({ error: err.message || 'Could not verify wallet payment with Paystack.', verified: false });
  }
});

export default router;
