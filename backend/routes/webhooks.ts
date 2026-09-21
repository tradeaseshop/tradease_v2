import { Router } from 'express';
import crypto from 'crypto';
import db from '../db';
import { notifyOrderParties } from '../notifications';

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

  if (!INBOUND_SECRET) return res.status(503).json({ error: 'DELIVERI webhook secret is not configured' });
  if (!verifySignature(rawBody, signature, INBOUND_SECRET)) {
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

  db.prepare(`UPDATE delivery_jobs SET status=?,carrier_status=?,rider_name=?,pickup_at=?,transit_at=?,delivered_at=?,rejected_reason=?,last_event_at=datetime('now'),updated_at=datetime('now') WHERE order_id=? AND tracking_number=?`).run(b.status||order.deliveri_status,b.carrierStatus||order.carrier_status,b.driverName||null,b.pickedUpAt||null,b.transitAt||null,b.deliveredAt||null,b.rejectedReason||null,order.id,b.trackingNumber);
  db.prepare(`UPDATE orders SET carrier_status=?,deliveri_status=? WHERE id=?`).run(b.carrierStatus||order.carrier_status,b.status||order.deliveri_status,order.id);
  if(nextOrderStatus==='Delivered'){
    db.prepare("UPDATE vendor_orders SET status='Delivered',delivery_status='Delivered',updated_at=datetime('now') WHERE order_id=?").run(order.id);
    db.prepare("UPDATE orders SET status='Delivered' WHERE id=?").run(order.id);
    const rows=db.prepare('SELECT * FROM vendor_orders WHERE order_id=?').all(order.id) as any[];
    for(const row of rows)db.prepare("INSERT OR IGNORE INTO vendor_ledger(id,vendor_id,order_id,vendor_order_id,entry_type,direction,amount,description) VALUES(?,?,?,?,?,?,?,?)").run(`LED-${order.id}-${row.vendor_id}`,row.vendor_id,order.id,row.id,'Sale','credit',row.vendor_earnings,'Vendor earnings from delivered order');
  }else if(['Processing','Shipped'].includes(nextOrderStatus))db.prepare('UPDATE orders SET status=? WHERE id=?').run(nextOrderStatus,order.id);

  notifyOrderParties(order.id, `Delivery update: ${b.status || nextOrderStatus}`, `Your order ${order.id} has a new delivery update: ${b.status || nextOrderStatus}.`, 'delivery');
  res.status(200).json({ received: true, matched: true, orderId: order.id });
});

export default router;
