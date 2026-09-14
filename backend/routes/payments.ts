import { Router } from 'express';
import { verifyTransaction, isPaystackConfigured } from '../paystackClient';

const router = Router();
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY || '';

// GET /api/payments/config — lets the frontend fetch the public key at
// runtime instead of baking it into the build, matching how the rest of
// this app keeps configuration on the server.
router.get('/config', (_req, res) => {
  res.json({
    configured: isPaystackConfigured() && Boolean(PAYSTACK_PUBLIC_KEY),
    publicKey: PAYSTACK_PUBLIC_KEY || null,
  });
});

// POST /api/payments/verify  { reference, expectedAmount }
//
// Called right after the Paystack popup reports success, before the order is
// actually created. This is the one part of the payment flow that can't be
// spoofed: the amount is re-checked against Paystack's own records using the
// secret key, not trusted from whatever the browser says happened. If the
// verified amount doesn't match what the order should cost, verification
// fails and the frontend won't create the order.
router.post('/verify', async (req, res) => {
  const { reference, expectedAmount } = req.body || {};
  if (!reference) {
    return res.status(400).json({ error: 'reference is required' });
  }
  try {
    const result = await verifyTransaction(reference);
    if (!result.verified) {
      return res.status(402).json({ error: `Payment was not successful (status: ${result.status}).`, verified: false });
    }
    if (typeof expectedAmount === 'number' && Math.round(result.amountNaira) < Math.round(expectedAmount)) {
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

export default router;
