import { Router } from 'express';
import crypto from 'crypto';
import db from '../db';

const router = Router();
const INBOUND_SECRET = process.env.DELIVERI_WEBHOOK_SECRET || '';

function verifySignature(rawBody: string, signature: string | undefined, secret: string): boolean {
  if (!signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(signature, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * POST /api/webhooks/deliveri
 *
 * DELIVERI calls this automatically whenever a delivery it's carrying for
 * TradeEase changes status (picked up, in transit, delivered, rejected).
 * The order is looked up by its DELIVERI tracking number and updated in
 * place — no polling required on TradeEase's side.
 *
 * Authentication: verified via HMAC-SHA256 signature in the
 * `X-Deliveri-Signature` header, using the shared secret in
 * DELIVERI_WEBHOOK_SECRET (must match TRADEEASE_WEBHOOK_SECRET on
 * DELIVERI's side).
 *
 * Expected JSON body (sent by DELIVERI's backend/webhookClient.ts):
 * {
 *   "event": "delivery.status_updated",
 *   "orderId": "TE-4821",
 *   "trackingNumber": "TE-SE-48213",
 *   "status": "In Transit",
 *   "carrierStatus": "In Transit to Destination",
 *   "orderStatus": "Shipped",
 *   "driverName": "Chidi Anya",
 *   "rejectedReason": null,
 *   "pickedUpAt": "...", "transitAt": "...", "deliveredAt": "...",
 *   "timestamp": "..."
 * }
 */
router.post('/deliveri', (req, res) => {
  const signature = req.headers['x-deliveri-signature'] as string | undefined;
  const rawBody = (req as any).rawBody || JSON.stringify(req.body);

  if (INBOUND_SECRET && !verifySignature(rawBody, signature, INBOUND_SECRET)) {
    return res.status(401).json({ error: 'Invalid or missing webhook signature' });
  }

  const b = req.body || {};
  if (!b.trackingNumber) {
    return res.status(400).json({ error: 'trackingNumber is required' });
  }

  const order = db
    .prepare('SELECT * FROM orders WHERE deliveri_tracking_number = ? OR tracking_number = ?')
    .get(b.trackingNumber, b.trackingNumber) as any;

  if (!order) {
    // Not an error from DELIVERI's point of view — just nothing to update on our side.
    return res.status(200).json({ received: true, matched: false });
  }

  const allowedOrderStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  const nextOrderStatus = allowedOrderStatuses.includes(b.orderStatus) ? b.orderStatus : order.status;

  db.prepare(
    `UPDATE orders SET
      carrier_status = ?,
      deliveri_status = ?,
      status = ?
     WHERE id = ?`
  ).run(b.carrierStatus || order.carrier_status, b.status || order.deliveri_status, nextOrderStatus, order.id);

  res.status(200).json({ received: true, matched: true, orderId: order.id });
});

export default router;
