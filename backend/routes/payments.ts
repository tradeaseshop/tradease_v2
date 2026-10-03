import { Router } from 'express';
import crypto from 'crypto';
import db from '../db';
import { verifyTransaction, isPaystackConfigured } from '../paystackClient';
import { optionalAuth } from '../auth';

const router = Router();
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY || '';

// GET /api/payments/config — lets the frontend fetch the public key at
// runtime instead of baking it into the build, matching how the rest of
// this app keeps configuration on the server.
router.get('/config', (_req, res) => {
  const secretConfigured = isPaystackConfigured();
  const publicConfigured = Boolean(PAYSTACK_PUBLIC_KEY);
  const publicKeyLooksValid = !PAYSTACK_PUBLIC_KEY || PAYSTACK_PUBLIC_KEY.startsWith('pk_live_') || PAYSTACK_PUBLIC_KEY.startsWith('pk_test_');
  const environment = PAYSTACK_PUBLIC_KEY.startsWith('pk_live_') ? 'live' : PAYSTACK_PUBLIC_KEY.startsWith('pk_test_') ? 'test' : 'unknown';
  const production = process.env.NODE_ENV === 'production';
  const configured = secretConfigured && publicConfigured && publicKeyLooksValid && (!production || environment === 'live');
  res.json({ configured, publicKey: PAYSTACK_PUBLIC_KEY || null, secretConfigured, publicConfigured, publicKeyLooksValid, environment, production, liveReady: configured && environment === 'live' });
});

// POST /api/payments/verify  { reference, expectedAmount }
//
// Called right after the Paystack popup reports success, before the order is
// actually created. This is the one part of the payment flow that can't be
// spoofed: the amount is re-checked against Paystack's own records using the
// secret key, not trusted from whatever the browser says happened. If the
// verified amount doesn't match what the order should cost, verification
// fails and the frontend won't create the order.
// GET /api/payments/callback?reference=... — safe browser-return verification.
// This endpoint never credits a wallet or creates an order. It only asks
// Paystack whether the supplied reference is successful so the public
// callback page can display a trustworthy payment status.
router.get('/callback', async (req, res) => {
  const reference = String(req.query.reference || req.query.trxref || '').trim();
  if (!reference || reference.length > 150) {
    return res.status(400).json({ error: 'A valid payment reference is required.', verified: false });
  }
  try {
    const result = await verifyTransaction(reference);
    return res.json({
      verified: result.verified && result.currency === 'NGN',
      status: result.status,
      reference: result.reference,
      paidAt: result.paidAt,
    });
  } catch (err: any) {
    console.error('[paystack] callback verification error:', err);
    return res.status(502).json({ error: err.message || 'Could not verify payment with Paystack.', verified: false });
  }
});

router.post('/verify', optionalAuth, async (req, res) => {
  const { reference, expectedAmount } = req.body || {};
  if (!reference || typeof reference !== 'string' || reference.length > 150) {
    return res.status(400).json({ error: 'A valid payment reference is required' });
  }
  if (typeof expectedAmount !== 'number' || !Number.isFinite(expectedAmount) || expectedAmount <= 0) {
    return res.status(400).json({ error: 'expectedAmount must be a positive number' });
  }
  try {
    const result = await verifyTransaction(reference);
    if (!result.verified || result.currency !== 'NGN') {
      return res.status(402).json({ error: `Payment was not successful (status: ${result.status}).`, verified: false });
    }
    if (Math.round(result.amountNaira * 100) !== Math.round(expectedAmount * 100)) {
      return res.status(402).json({
        error: `Amount mismatch: ₦${result.amountNaira.toLocaleString()} was paid but ₦${expectedAmount.toLocaleString()} was expected.`,
        verified: false,
      });
    }
    res.json({
      verified: true,
      reference: result.reference,
      amountNaira: result.amountNaira,
      paidAt: result.paidAt,
    });
  } catch (err: any) {
    console.error('[paystack] verification error:', err);
    res.status(502).json({ error: err.message || 'Could not verify payment with Paystack.', verified: false });
  }
});


// POST /api/payments/webhook — Paystack server-to-server notification.
// The frontend verification route remains in place, but this webhook gives
// TradeEase an independent recovery path if a buyer closes the payment
// window before the browser receives the success callback.
router.post('/webhook', async (req, res) => {
  const secret = process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY || '';
  const signature = String(req.headers['x-paystack-signature'] || '');
  const rawBody = (req as any).rawBody || JSON.stringify(req.body || {});
  if (!secret || !signature) return res.status(401).json({ error: 'Invalid webhook signature' });
  const expected = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(signature, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(401).json({ error: 'Invalid webhook signature' });

  const body = req.body || {};
  if (body.event !== 'charge.success') return res.status(200).json({ received: true, ignored: true });
  const reference = String(body?.data?.reference || '').trim();
  if (!reference) return res.status(400).json({ error: 'Missing transaction reference' });

  const pending = db.prepare(`SELECT * FROM wallet_transactions WHERE reference=? AND type='funding'`).get(reference) as any;
  if (!pending) return res.status(200).json({ received: true, matched: false });
  if (pending.status === 'Successful') return res.status(200).json({ received: true, alreadyProcessed: true });

  const amountNaira = Number(body?.data?.amount || 0) / 100;
  const currency = String(body?.data?.currency || '');
  const customerEmail = String(body?.data?.customer?.email || '').toLowerCase();
  if (currency !== 'NGN' || Math.round(amountNaira * 100) !== Math.round(Number(pending.amount) * 100)) {
    db.prepare("UPDATE wallet_transactions SET status='Failed',metadata=? WHERE id=? AND status='Pending'").run(JSON.stringify({ source:'paystack-webhook', amount:amountNaira, currency }), pending.id);
    return res.status(200).json({ received: true, verified: false });
  }
  const user = db.prepare('SELECT email FROM users WHERE id=?').get(pending.user_id) as any;
  if (customerEmail && user?.email && customerEmail !== String(user.email).toLowerCase()) {
    db.prepare("UPDATE wallet_transactions SET status='Failed',metadata=? WHERE id=? AND status='Pending'").run(JSON.stringify({ source:'paystack-webhook', customerEmail }), pending.id);
    return res.status(200).json({ received: true, verified: false });
  }

  const result = db.transaction(() => {
    const updated = db.prepare("UPDATE wallet_transactions SET status='Successful',completed_at=?,metadata=? WHERE id=? AND status='Pending'").run(body?.data?.paid_at || new Date().toISOString(), JSON.stringify({ source:'paystack-webhook', reference }), pending.id);
    if (updated.changes !== 1) return false;
    db.prepare('INSERT OR IGNORE INTO buyer_wallets(user_id,balance) VALUES(?,0)').run(pending.user_id);
    db.prepare("UPDATE buyer_wallets SET balance=ROUND(balance+?,2),updated_at=datetime('now') WHERE user_id=?").run(Number(pending.amount), pending.user_id);
    return true;
  })();
  return res.status(200).json({ received: true, verified: true, credited: result });
});

export default router;
