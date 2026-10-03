import { Router } from 'express';
import crypto from 'crypto';
import db from '../db';
import { notifyOrderParties } from '../notifications';

const router = Router();
const INBOUND_SECRET = process.env.DELIVERI_TO_TRADEEASE_SECRET || process.env.DELIVERI_WEBHOOK_SECRET || process.env.TRADEEASE_WEBHOOK_SECRET || '';

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

  const raw = req.body || {};
  const data = raw?.data && typeof raw.data === 'object' ? raw.data : raw;
  const b = {
    eventId: String(raw?.eventId || req.headers['x-deliveri-event-id'] || '').trim() || null,
    fulfillmentId: data.fulfillmentId || data.vendorOrderId || data.orderId || null,
    orderId: data.orderId || null,
    vendorOrderId: data.vendorOrderId || null,
    trackingNumber: data.trackingNumber || null,
    status: data.status || null,
    carrierStatus: data.carrierStatus || null,
    orderStatus: data.orderStatus || null,
    driverName: data.driverName || null,
    rejectedReason: data.rejectedReason || null,
    pickedUpAt: data.pickedUpAt || null,
    transitAt: data.transitAt || null,
    deliveredAt: data.deliveredAt || null,
    deliveryFee: Number(data.deliveryFee || 0),
  };
  if (!b.trackingNumber && !b.orderId) {
    return res.status(400).json({ error: 'trackingNumber or orderId is required' });
  }
  const eventId = b.eventId || crypto.createHash('sha256').update(rawBody).digest('hex');
  const duplicate = db.prepare('SELECT id FROM deliveri_webhook_events WHERE event_id=?').get(eventId);
  if (duplicate) return res.status(200).json({ received:true, duplicate:true });
  db.prepare('INSERT INTO deliveri_webhook_events(id,event_id,event_type,payload_json) VALUES(?,?,?,?)').run(`DWE-${eventId}`,eventId,raw?.eventType||raw?.event||'delivery.status_updated',rawBody);

  const order = b.trackingNumber
    ? db.prepare(`SELECT * FROM orders WHERE id IN (SELECT order_id FROM delivery_fulfillments WHERE tracking_number=?) OR deliveri_tracking_number=? OR tracking_number=?`).get(b.trackingNumber,b.trackingNumber,b.trackingNumber) as any
    : db.prepare('SELECT * FROM orders WHERE id = ?').get(b.orderId) as any;
  if (!order) return res.status(200).json({ received:true, matched:false });

  const fulfillmentId = b.fulfillmentId || b.vendorOrderId || null;
  const target = db.prepare(`SELECT * FROM delivery_fulfillments WHERE order_id=? AND ((? IS NOT NULL AND fulfillment_id=?) OR (? IS NOT NULL AND tracking_number=?)) LIMIT 1`).get(order.id,fulfillmentId,fulfillmentId,b.trackingNumber,b.trackingNumber) as any;
  if (target) {
    db.prepare(`UPDATE delivery_fulfillments SET status=?,carrier_status=?,driver_name=?,picked_up_at=?,transit_at=?,delivered_at=?,rejected_reason=?,external_delivery_id=COALESCE(external_delivery_id,?),last_event_at=datetime('now'),updated_at=datetime('now'),tracking_number=COALESCE(tracking_number,?) WHERE id=?`).run(b.status||target.status,b.carrierStatus||target.carrier_status,b.driverName||target.driver_name,b.pickedUpAt||target.picked_up_at,b.transitAt||target.transit_at,b.deliveredAt||target.delivered_at,b.rejectedReason||target.rejected_reason,raw?.deliveryId||null,b.trackingNumber,target.id);
  }
  // Backwards compatibility for single-delivery/legacy rows.
  db.prepare(`UPDATE delivery_jobs SET status=?,carrier_status=?,rider_name=?,pickup_at=?,transit_at=?,delivered_at=?,rejected_reason=?,external_delivery_id=COALESCE(external_delivery_id,?),last_event_at=datetime('now'),updated_at=datetime('now') WHERE order_id=? AND (tracking_number=? OR ? IS NULL)`).run(b.status||order.deliveri_status,b.carrierStatus||order.carrier_status,b.driverName||null,b.pickedUpAt||null,b.transitAt||null,b.deliveredAt||null,b.rejectedReason||null,raw?.deliveryId||null,order.id,b.trackingNumber,b.trackingNumber);

  const all = db.prepare(`SELECT status FROM delivery_fulfillments WHERE order_id=?`).all(order.id) as any[];
  const hasFulfilments=all.length>0;
  const allDelivered=hasFulfilments && all.every(x=>x.status==='Delivered');
  const anyInTransit=all.some(x=>x.status==='In Transit');
  const anyPicked=all.some(x=>x.status==='Picked Up');
  const nextOrderStatus = allDelivered ? 'Delivered' : (anyInTransit ? 'Shipped' : (anyPicked ? 'Processing' : (b.orderStatus && ['Processing','Shipped'].includes(b.orderStatus) ? b.orderStatus : order.status)));
  db.prepare(`UPDATE orders SET carrier_status=?,deliveri_status=?,deliveri_tracking_number=COALESCE(?,deliveri_tracking_number),tracking_number=COALESCE(?,tracking_number),status=? WHERE id=?`).run(b.carrierStatus||order.carrier_status,b.status||order.deliveri_status,b.trackingNumber,b.trackingNumber,nextOrderStatus,order.id);
  if (b.deliveredAt || b.status==='Delivered') {
    const rows=db.prepare('SELECT * FROM vendor_orders WHERE order_id=?').all(order.id) as any[];
    if(allDelivered || !hasFulfilments) for(const row of rows) db.prepare("INSERT OR IGNORE INTO vendor_ledger(id,vendor_id,order_id,vendor_order_id,entry_type,direction,amount,description) VALUES(?,?,?,?,?,?,?,?)").run(`LED-${order.id}-${row.vendor_id}`,row.vendor_id,order.id,row.id,'Sale','credit',row.vendor_earnings,'Vendor earnings from delivered order');
  }
  notifyOrderParties(order.id, `Delivery update: ${b.status || nextOrderStatus}`, `Your order ${order.id} has a new delivery update: ${b.status || nextOrderStatus}.`, 'delivery');
  res.status(200).json({ received: true, matched: true, orderId: order.id });
});

export default router;
