import { Router } from 'express';
import db from '../db';
import { toOrder } from '../serialize';
import { optionalAuth, requireRole } from '../auth';
import { sendOrderToDeliveri } from '../deliveriClient';
import { verifyTransaction } from '../paystackClient';

const router = Router();

function loadOrder(id: string) {
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
  if (!row) return null;
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);
  return toOrder(row, items);
}

// GET /api/orders?vendorId=  -> vendors get orders containing at least one of their products
router.get('/', optionalAuth, (req, res) => {
  const { vendorId } = req.query as Record<string, string | undefined>;
  let ids: string[];
  if (vendorId) {
    ids = db
      .prepare(
        `SELECT DISTINCT oi.order_id AS id FROM order_items oi
         JOIN products p ON p.id = oi.product_id
         WHERE p.vendor_id = ?`
      )
      .all(vendorId)
      .map((r: any) => r.id);
  } else {
    ids = db.prepare('SELECT id FROM orders ORDER BY date DESC').all().map((r: any) => r.id);
  }
  const orders = ids.map(loadOrder).filter(Boolean);
  orders.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  res.json(orders);
});

// GET /api/orders/:id
router.get('/:id', (req, res) => {
  const order = loadOrder(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

// POST /api/orders  -> place a new order from the current cart
router.post('/', optionalAuth, async (req, res) => {
  const b = req.body || {};
  if (!Array.isArray(b.items) || b.items.length === 0) {
    return res.status(400).json({ error: 'items array is required' });
  }
  if (!b.buyerName || !b.address) {
    return res.status(400).json({ error: 'buyerName and address are required' });
  }

  const subtotal = b.items.reduce((sum: number, it: any) => sum + (it.price || 0) * (it.quantity || 1), 0);
  const shippingCost = b.shippingCost || 0;
  const total = b.totalAmount ?? subtotal + shippingCost;

  // Card payments are re-verified here, independently of anything the client
  // claims. This is a separate, server-to-server check with Paystack — a
  // request that simply says `paymentStatus: "Paid"` without ever having
  // paid gets rejected here, regardless of what the frontend already showed
  // the shopper.
  const paymentMethod: 'wallet' | 'bank' | 'card' = ['wallet', 'bank', 'card'].includes(b.paymentMethod) ? b.paymentMethod : 'wallet';
  let paymentStatus: 'Pending' | 'Paid' | 'Failed' = paymentMethod === 'wallet' ? 'Paid' : 'Pending';
  let paymentReference: string | null = b.paymentReference || null;

  if (paymentMethod === 'card') {
    if (!paymentReference) {
      return res.status(400).json({ error: 'paymentReference is required for card payments' });
    }
    try {
      const verification = await verifyTransaction(paymentReference);
      const tolerance = 1; // allow for sub-naira rounding
      if (!verification.verified || verification.amountNaira + tolerance < total) {
        return res.status(402).json({
          error: `Card payment could not be confirmed for the full order amount (₦${total.toLocaleString()}). This order was not placed.`,
        });
      }
      paymentStatus = 'Paid';
      paymentReference = verification.reference;
    } catch (err: any) {
      console.error('[paystack] order-time re-verification failed:', err);
      return res.status(402).json({ error: 'Could not confirm card payment with Paystack. This order was not placed.' });
    }
  }

  const id = `TE-${Math.floor(1000 + Math.random() * 9000)}`;
  const providerId = b.logisticsProviderId || 'provider-deliveri';
  const providerName = b.logisticsProviderName || 'DELIVERI Logistics';

  // Fallback tracking details, used as-is unless the chosen provider is
  // DELIVERI, in which case we hand the order off for real fulfilment below
  // and use its real tracking number and QR token instead.
  let trackingCode = b.trackingNumber || `TRK-${Math.floor(100 + Math.random() * 899)}-${Math.floor(1000 + Math.random() * 8999)}`;
  let carrierStatus = b.carrierStatus || 'Dispatch Order Generated';
  let qrCodeToken: string | null = null;

  if (providerId === 'provider-deliveri') {
    const vendorNames = [...new Set(b.items.map((it: any) => it.vendorName).filter(Boolean))].join(', ');
    const packageDescription = b.items.map((it: any) => `${it.quantity}x ${it.productTitle}`).join(', ');
    const fulfilment = await sendOrderToDeliveri({
      orderId: id,
      buyerName: b.buyerName,
      buyerPhone: b.buyerPhone,
      deliveryAddress: b.address,
      city: b.city,
      state: b.state,
      vendorName: vendorNames || undefined,
      packageDescription,
      packageValue: subtotal,
      deliveryFee: shippingCost,
      paymentMethod: 'Cash on Delivery',
      paymentStatus: 'Pending',
    });
    if (fulfilment) {
      trackingCode = fulfilment.trackingNumber;
      qrCodeToken = fulfilment.qrCodeToken;
      carrierStatus = 'Dispatch Order Generated - Handed to DELIVERI';
    }
  }

  const insertOrder = db.prepare(
    `INSERT INTO orders
      (id, buyer_id, buyer_name, buyer_phone, city, state, address, total_amount, status, shipping_method,
       shipping_cost, logistics_provider_id, logistics_provider_name, tracking_number, carrier_status,
       deliveri_tracking_number, deliveri_status, payment_method, payment_status, payment_reference)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertItem = db.prepare(
    `INSERT INTO order_items (order_id, product_id, product_title, price, quantity, image) VALUES (?, ?, ?, ?, ?, ?)`
  );
  const decrementStock = db.prepare(`UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?`);
  const bumpUserSpend = db.prepare(
    `UPDATE users SET total_orders = total_orders + 1, total_spent = total_spent + ? WHERE id = ?`
  );

  const tx = db.transaction(() => {
    insertOrder.run(
      id,
      req.auth?.id || null,
      b.buyerName,
      b.buyerPhone || null,
      b.city || null,
      b.state || null,
      b.address,
      total,
      b.shippingMethod || `${providerName} Standard Courier`,
      shippingCost,
      providerId,
      providerName,
      trackingCode,
      carrierStatus,
      trackingCode,
      'Ordered',
      paymentMethod,
      paymentStatus,
      paymentReference
    );
    for (const item of b.items) {
      insertItem.run(id, item.productId, item.productTitle, item.price, item.quantity, item.image || null);
      if (item.productId) decrementStock.run(item.quantity, item.productId);
    }
    if (req.auth?.id) bumpUserSpend.run(total, req.auth.id);
  });
  tx();

  res.status(201).json(loadOrder(id));
});

// PUT /api/orders/:id/status  { status }  (vendor or admin)
router.put('/:id/status', requireRole('vendor', 'admin'), (req, res) => {
  const { status } = req.body || {};
  const allowed = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` });
  }
  const existing = db.prepare('SELECT id FROM orders WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Order not found' });
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json(loadOrder(req.params.id));
});

export default router;
