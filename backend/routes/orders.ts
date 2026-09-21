import { Router } from 'express';
import { randomUUID } from 'crypto';
import db from '../db';
import { toOrder } from '../serialize';
import { optionalAuth, requireAuth, requireRole } from '../auth';
import { sendOrderToDeliveri } from '../deliveriClient';
import { verifyTransaction } from '../paystackClient';
import { notifyOrderParties } from '../notifications';

const router = Router();

type DeliveryUrgency = 'economy' | 'speedy' | 'flash';

function loadOrder(id: string) {
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
  if (!row) return null;
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);
  const vendorOrders = db.prepare(`SELECT vo.*, v.name AS vendor_name FROM vendor_orders vo JOIN vendors v ON v.id=vo.vendor_id WHERE vo.order_id=? ORDER BY vo.created_at`).all(id) as any[];
  const shapedVendorOrders = vendorOrders.map(v => ({ id:v.id, vendorId:v.vendor_id, vendorName:v.vendor_name, status:v.status, subtotal:v.subtotal, commissionAmount:v.commission_amount, vendorEarnings:v.vendor_earnings, deliveryStatus:v.delivery_status, createdAt:v.created_at, updatedAt:v.updated_at }));
  return toOrder({...row, vendor_orders: shapedVendorOrders}, items);
}

function productWeight(category: string, title: string): number {
  const cat = (category || '').toLowerCase();
  const name = (title || '').toLowerCase();
  if (name.includes('ebook') || name.includes('epub') || name.includes('pdf') || cat.includes('book') || cat.includes('digital')) return 0;
  if (name.includes('solar') || name.includes('battery') || name.includes('fan') || name.includes('generator') || cat.includes('solar') || cat.includes('device') || cat.includes('electronic')) return 8.5;
  if (cat.includes('food') || cat.includes('recipe') || name.includes('garri') || name.includes('yam') || name.includes('rice')) return 5;
  if (cat.includes('beauty') || cat.includes('fashion') || name.includes('dress') || name.includes('clothing') || name.includes('makeup')) return 0.65;
  return 1.4;
}

function baseStateDistanceKm(stateName: string): number {
  const norm = (stateName || '').toLowerCase();
  if (norm.includes('lagos')) return 25;
  if (norm.includes('ogun')) return 90;
  if (norm.includes('oyo')) return 145;
  if (norm.includes('osun')) return 210;
  if (norm.includes('ondo')) return 240;
  if (norm.includes('ekiti')) return 280;
  if (norm.includes('edo') || norm.includes('benin')) return 310;
  if (norm.includes('delta')) return 370;
  if (norm.includes('anambra') || norm.includes('onitsha')) return 420;
  if (norm.includes('enugu')) return 510;
  if (norm.includes('imo') || norm.includes('owerri')) return 480;
  if (norm.includes('abia')) return 530;
  if (norm.includes('rivers') || norm.includes('port')) return 590;
  if (norm.includes('bayelsa')) return 620;
  if (norm.includes('akwa') || norm.includes('uyo')) return 640;
  if (norm.includes('cross') || norm.includes('calabar')) return 720;
  if (norm.includes('ebonyi')) return 540;
  if (norm.includes('kogi')) return 410;
  if (norm.includes('kwara')) return 550;
  if (norm.includes('niger')) return 700;
  if (norm.includes('benue') || norm.includes('makurdi')) return 640;
  if (norm.includes('plateau') || norm.includes('jos')) return 760;
  if (norm.includes('kaduna')) return 710;
  if (norm.includes('kano')) return 960;
  if (norm.includes('katsina')) return 1020;
  if (norm.includes('jigawa')) return 1080;
  if (norm.includes('sokoto')) return 980;
  if (norm.includes('kebbi')) return 890;
  if (norm.includes('zamfara')) return 840;
  if (norm.includes('bauchi')) return 920;
  if (norm.includes('gombe')) return 1100;
  if (norm.includes('yobe')) return 1190;
  if (norm.includes('borno') || norm.includes('maiduguri')) return 1320;
  if (norm.includes('adamawa')) return 1250;
  if (norm.includes('taraba')) return 910;
  return 450;
}

function calculateShipping(baseFee: number, items: any[], state: string, lastMileKm: number, urgency: DeliveryUrgency) {
  const totalWeightKg = items.reduce((sum, it) => sum + productWeight(it.category, it.title) * it.quantity, 0);
  const weightSurcharge = Math.round(totalWeightKg * 300);
  const totalDistanceKm = baseStateDistanceKm(state) + lastMileKm;
  const distanceSurcharge = Math.round(totalDistanceKm * 15);
  const urgencySurcharge = urgency === 'speedy' ? 1800 : urgency === 'flash' ? 4500 : 0;
  return {
    totalWeightKg,
    totalDistanceKm,
    shippingCost: Math.max(0, Math.round(baseFee + weightSurcharge + distanceSurcharge + urgencySurcharge)),
  };
}

function normaliseItems(rawItems: any[]) {
  if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > 100) throw new Error('items must contain between 1 and 100 products');
  const merged = new Map<string, number>();
  for (const raw of rawItems) {
    const productId = String(raw?.productId || '').trim();
    const quantity = Number(raw?.quantity);
    if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 1000) throw new Error('Each item must have a valid productId and quantity');
    merged.set(productId, (merged.get(productId) || 0) + quantity);
  }
  return [...merged.entries()].map(([productId, quantity]) => ({ productId, quantity }));
}

function authoritativeCart(items: Array<{ productId: string; quantity: number }>) {
  const placeholders = items.map(() => '?').join(',');
  const rows = db.prepare(`SELECT id, title, price, image, category, vendor_name, vendor_id, stock FROM products WHERE id IN (${placeholders})`).all(...items.map(i => i.productId)) as any[];
  const byId = new Map(rows.map(r => [r.id, r]));
  const resolved = items.map(i => {
    const p = byId.get(i.productId);
    if (!p) throw new Error(`Product ${i.productId} no longer exists`);
    if (p.stock < i.quantity) throw new Error(`${p.title} does not have enough stock available`);
    return { ...i, ...p };
  });
  return resolved;
}

function commissionRateForVendor(vendorId: string): number {
  const platform = db.prepare('SELECT commission_percent FROM platform_settings WHERE id=1').get() as any;
  const vendor = db.prepare('SELECT commission_percent FROM vendors WHERE id=?').get(vendorId) as any;
  return Number(vendor?.commission_percent ?? platform?.commission_percent ?? 8);
}

function syncVendorOrders(orderId: string) {
  const groups = db.prepare(`SELECT vendor_id, SUM(price*quantity) subtotal FROM order_items WHERE order_id=? AND vendor_id IS NOT NULL GROUP BY vendor_id`).all(orderId) as any[];
  for (const g of groups) {
    const lines=db.prepare(`SELECT oi.price,oi.quantity,p.commission_percent FROM order_items oi LEFT JOIN products p ON p.id=oi.product_id WHERE oi.order_id=? AND oi.vendor_id=?`).all(orderId,g.vendor_id) as any[];
    const subtotal=Number(g.subtotal||0);
    const commission=Math.round(lines.reduce((sum,line)=>sum + (Number(line.price)*Number(line.quantity)*Number(line.commission_percent ?? commissionRateForVendor(g.vendor_id))/100),0)*100)/100;
    const earnings=Math.round((subtotal-commission)*100)/100;
    const id=`VO-${orderId}-${g.vendor_id}`; const status=(db.prepare('SELECT status FROM orders WHERE id=?').get(orderId) as any)?.status||'Pending';
    db.prepare(`INSERT OR IGNORE INTO vendor_orders(id,order_id,vendor_id,status,subtotal,commission_amount,vendor_earnings) VALUES(?,?,?,?,?,?,?)`).run(id,orderId,g.vendor_id,status,subtotal,commission,earnings);
    db.prepare(`UPDATE vendor_orders SET subtotal=?,commission_amount=?,vendor_earnings=?,updated_at=datetime('now') WHERE id=?`).run(subtotal,commission,earnings,id);
  }
}
function recordVendorLedgerForDeliveredOrder(orderId:string){
  syncVendorOrders(orderId);
  const rows=db.prepare('SELECT * FROM vendor_orders WHERE order_id=?').all(orderId) as any[];
  for(const row of rows) db.prepare(`INSERT OR IGNORE INTO vendor_ledger(id,vendor_id,order_id,vendor_order_id,entry_type,direction,amount,description) VALUES(?,?,?,?,?,?,?,?)`).run(`LED-${orderId}-${row.vendor_id}`,row.vendor_id,orderId,row.id,'Sale','credit',row.vendor_earnings,'Vendor earnings from delivered order');
}
function recomputeParentOrderStatus(orderId:string){
  const rows=db.prepare('SELECT status FROM vendor_orders WHERE order_id=?').all(orderId) as any[]; if(!rows.length)return;
  const st=rows.map(r=>r.status); let next='Pending';
  if(st.every(x=>x==='Cancelled'))next='Cancelled'; else if(st.every(x=>x==='Delivered'))next='Delivered'; else if(st.some(x=>x==='Shipped'))next='Shipped'; else if(st.some(x=>x==='Processing'))next='Processing';
  db.prepare('UPDATE orders SET status=? WHERE id=?').run(next,orderId); if(next==='Delivered')recordVendorLedgerForDeliveredOrder(orderId);
}

// GET /api/orders — authenticated users only. Buyers see their own orders,
// vendors see orders containing their products, and admins can see all.
router.get('/', requireAuth, (req, res) => {
  let ids: string[] = [];
  if (req.auth!.role === 'admin') {
    ids = db.prepare('SELECT id FROM orders ORDER BY date DESC').all().map((r: any) => r.id);
  } else if (req.auth!.role === 'vendor') {
    const vendor = db.prepare('SELECT id FROM vendors WHERE user_id = ?').get(req.auth!.id) as any;
    if (!vendor) return res.json([]);
    ids = db.prepare(`SELECT DISTINCT oi.order_id AS id FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE p.vendor_id = ?`).all(vendor.id).map((r: any) => r.id);
  } else {
    ids = db.prepare('SELECT id FROM orders WHERE buyer_id = ? ORDER BY date DESC').all(req.auth!.id).map((r: any) => r.id);
  }
  const orders = ids.map(loadOrder).filter(Boolean) as any[];
  orders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  res.json(orders);
});

// GET /api/orders/quote — server-authoritative price quote used before Paystack.
router.post('/quote', optionalAuth, (req, res) => {
  try {
    const items = normaliseItems(req.body?.items);
    const products = authoritativeCart(items);
    const providerId = String(req.body?.logisticsProviderId || 'provider-deliveri');
    const provider = db.prepare('SELECT id, name, base_fee, status FROM logistics_providers WHERE id = ?').get(providerId) as any;
    if (!provider || provider.status !== 'active') return res.status(400).json({ error: 'Selected logistics provider is unavailable' });
    const state = String(req.body?.state || '');
    const lastMileKm = Math.min(200, Math.max(0, Number(req.body?.lastMileKm) || 0));
    const urgency: DeliveryUrgency = ['economy', 'speedy', 'flash'].includes(req.body?.deliveryUrgency) ? req.body.deliveryUrgency : 'economy';
    const shipping = calculateShipping(Number(provider.base_fee), products, state, lastMileKm, urgency);
    const subtotal = products.reduce((sum, p) => sum + Number(p.price) * p.quantity, 0);
    res.json({
      items: products.map(p => ({ productId: p.id, title: p.title, unitPrice: Number(p.price), quantity: p.quantity, lineTotal: Number(p.price) * p.quantity })),
      subtotal,
      shippingCost: shipping.shippingCost,
      total: subtotal + shipping.shippingCost,
      logisticsProviderId: provider.id,
      logisticsProviderName: provider.name,
      totalWeightKg: shipping.totalWeightKg,
      totalDistanceKm: shipping.totalDistanceKm,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Could not calculate order quote' });
  }
});

// GET /api/orders/:id
router.get('/:id', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as any;
  if (!row) return res.status(404).json({ error: 'Order not found' });
  if (req.auth!.role === 'buyer' && row.buyer_id !== req.auth!.id) return res.status(403).json({ error: 'You do not have access to this order' });
  if (req.auth!.role === 'vendor') {
    const vendor = db.prepare('SELECT id FROM vendors WHERE user_id = ?').get(req.auth!.id) as any;
    const ownsItem = vendor && db.prepare(`SELECT 1 FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ? AND p.vendor_id = ? LIMIT 1`).get(req.params.id, vendor.id);
    if (!ownsItem) return res.status(403).json({ error: 'You do not have access to this order' });
  }
  res.json(loadOrder(req.params.id));
});

// POST /api/orders — all money values are calculated from current DB prices.
router.post('/', optionalAuth, async (req, res) => {
  const b = req.body || {};
  if (!b.buyerName || !b.address) return res.status(400).json({ error: 'buyerName and address are required' });
  let items;
  try { items = normaliseItems(b.items); } catch (err: any) { return res.status(400).json({ error: err.message }); }

  let products;
  try { products = authoritativeCart(items); } catch (err: any) { return res.status(409).json({ error: err.message }); }

  const providerId = String(b.logisticsProviderId || 'provider-deliveri');
  const provider = db.prepare('SELECT id, name, base_fee, status FROM logistics_providers WHERE id = ?').get(providerId) as any;
  if (!provider || provider.status !== 'active') return res.status(400).json({ error: 'Selected logistics provider is unavailable' });

  const state = String(b.state || '');
  const lastMileKm = Math.min(200, Math.max(0, Number(b.lastMileKm) || 0));
  const urgency: DeliveryUrgency = ['economy', 'speedy', 'flash'].includes(b.deliveryUrgency) ? b.deliveryUrgency : 'economy';
  const shipping = calculateShipping(Number(provider.base_fee), products, state, lastMileKm, urgency);
  const subtotal = products.reduce((sum, p) => sum + Number(p.price) * p.quantity, 0);
  const total = subtotal + shipping.shippingCost;

  const paymentMethod: 'wallet' | 'bank' | 'card' = ['wallet', 'bank', 'card'].includes(b.paymentMethod) ? b.paymentMethod : 'bank';
  let paymentStatus: 'Pending' | 'Paid' | 'Failed' = 'Pending';
  let paymentReference: string | null = b.paymentReference ? String(b.paymentReference).trim() : null;

  if (paymentMethod === 'wallet' && process.env.ALLOW_DEMO_WALLET !== 'true') {
    return res.status(400).json({ error: 'Wallet checkout is disabled until TradeEase has a server-side wallet ledger. Please use Paystack card payment or bank transfer.' });
  }
  if (paymentMethod === 'wallet') paymentStatus = 'Paid';

  if (paymentMethod === 'bank') {
    if (!paymentReference || paymentReference.length < 4 || paymentReference.length > 100) return res.status(400).json({ error: 'A valid bank transfer reference is required' });
    paymentStatus = 'Pending';
  }

  if (paymentMethod === 'card') {
    if (!paymentReference) return res.status(400).json({ error: 'paymentReference is required for card payments' });
    const alreadyUsed = db.prepare('SELECT id FROM orders WHERE payment_reference = ?').get(paymentReference);
    if (alreadyUsed) return res.status(409).json({ error: 'This payment reference has already been used for an order' });
    try {
      const verification = await verifyTransaction(paymentReference);
      if (!verification.verified || verification.currency !== 'NGN' || Math.round(verification.amountNaira * 100) !== Math.round(total * 100)) {
        return res.status(402).json({ error: `Card payment amount could not be confirmed. Expected ₦${total.toLocaleString()} in NGN.` });
      }
      paymentStatus = 'Paid';
      paymentReference = verification.reference;
    } catch (err: any) {
      console.error('[paystack] order-time re-verification failed:', err);
      return res.status(402).json({ error: 'Could not confirm card payment with Paystack. This order was not placed.' });
    }
  }

  const id = `TE-${randomUUID().slice(0, 8).toUpperCase()}`;
  let trackingCode = b.trackingNumber || `TRK-${Math.floor(100 + Math.random() * 899)}-${Math.floor(1000 + Math.random() * 8999)}`;
  let carrierStatus = b.carrierStatus || 'Dispatch Order Generated';

  if (providerId === 'provider-deliveri') {
    const vendorNames = [...new Set(products.map((it: any) => it.vendor_name).filter(Boolean))].join(', ');
    const packageDescription = products.map((it: any) => `${it.quantity}x ${it.title}`).join(', ');
    const fulfilment = await sendOrderToDeliveri({
      orderId: id,
      buyerName: String(b.buyerName),
      buyerPhone: b.buyerPhone,
      deliveryAddress: String(b.address),
      city: b.city,
      state: b.state,
      vendorName: vendorNames || undefined,
      packageDescription,
      packageValue: subtotal,
      deliveryFee: shipping.shippingCost,
      paymentMethod: paymentMethod === 'card' ? 'Card' : paymentMethod === 'bank' ? 'Bank Transfer' : 'Wallet',
      paymentStatus,
    });
    if (fulfilment) {
      trackingCode = fulfilment.trackingNumber;
      carrierStatus = 'Dispatch Order Generated - Handed to DELIVERI';
    }
  }

  const tx = db.transaction(() => {
    // Re-check stock inside the write transaction to reduce overselling under concurrent checkouts.
    for (const item of products) {
      const current = db.prepare('SELECT stock FROM products WHERE id = ?').get(item.id) as any;
      if (!current || current.stock < item.quantity) throw new Error(`${item.title} sold out while you were checking out`);
    }
    db.prepare(
      `INSERT INTO orders
       (id, buyer_id, buyer_name, buyer_phone, city, state, address, total_amount, server_subtotal, quote_shipping_cost,
        status, shipping_method, shipping_cost, logistics_provider_id, logistics_provider_name, tracking_number, carrier_status,
        deliveri_tracking_number, deliveri_status, payment_method, payment_status, payment_reference)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id, req.auth?.id || null, String(b.buyerName), b.buyerPhone || null, b.city || null, b.state || null, String(b.address),
      total, subtotal, shipping.shippingCost, b.shippingMethod || `${provider.name} Standard Courier`, shipping.shippingCost,
      providerId, provider.name, trackingCode, carrierStatus, trackingCode, 'Ordered', paymentMethod, paymentStatus, paymentReference
    );
    const insertItem = db.prepare('INSERT INTO order_items (order_id, product_id, product_title, price, quantity, image, vendor_id, digital_format) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    const decrement = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
    for (const item of products) {
      insertItem.run(id, item.id, item.title, item.price, item.quantity, item.image || null, item.vendor_id || null, item.digitalFormat || null);
      decrement.run(item.quantity, item.id);
    }
    syncVendorOrders(id);
    if (req.auth?.id) db.prepare('UPDATE users SET total_orders = total_orders + 1, total_spent = total_spent + ? WHERE id = ?').run(total, req.auth.id);
  });

  try {
    tx();
    if(providerId==='provider-deliveri') db.prepare(`INSERT OR REPLACE INTO delivery_jobs(id,order_id,provider_id,provider_name,external_delivery_id,tracking_number,status,carrier_status,last_event_at,updated_at) VALUES(?,?,?,?,?,?,?,?,datetime('now'),datetime('now'))`).run(`DJ-${id}`,id,providerId,provider.name,null,trackingCode,'Queued',carrierStatus);
  } catch (err: any) {
    console.error('[orders] transaction failed:', err);
    return res.status(409).json({ error: err.message || 'Could not create order' });
  }

  notifyOrderParties(id, paymentStatus === 'Paid' ? 'Order confirmed' : 'Order received', `Order ${id} has been placed successfully.`, 'order');
  res.status(201).json(loadOrder(id));
});

// PUT /api/orders/:id/status — vendors update only their own vendor fulfilment; admins can update the parent order.
router.put('/:id/status', requireRole('vendor','admin'), (req,res)=>{
 const {status}=req.body||{}; const allowed=['Pending','Processing','Shipped','Delivered','Cancelled'];
 if(!allowed.includes(status))return res.status(400).json({error:`status must be one of: ${allowed.join(', ')}`});
 if(!db.prepare('SELECT id FROM orders WHERE id=?').get(req.params.id))return res.status(404).json({error:'Order not found'});
 syncVendorOrders(req.params.id);
 if(req.auth!.role==='vendor'){
  const vendor=db.prepare('SELECT id,account_status,store_status FROM vendors WHERE user_id=?').get(req.auth!.id) as any;
  if(!vendor)return res.status(403).json({error:'Vendor profile not found'});
  if(vendor.account_status!=='Active'||vendor.store_status!=='Active')return res.status(403).json({error:'Your vendor account/store is not active'});
  if(!['Processing','Shipped'].includes(status))return res.status(403).json({error:'Vendors can only move their fulfilment to Processing or Shipped'});
  const vo=db.prepare('SELECT * FROM vendor_orders WHERE order_id=? AND vendor_id=?').get(req.params.id,vendor.id) as any;
  if(!vo)return res.status(403).json({error:'This order contains no products from your store'});
  const transitions:Record<string,string[]>={Pending:['Processing'],Processing:['Shipped'],Shipped:[]};
  if(!transitions[vo.status]?.includes(status))return res.status(409).json({error:`Invalid vendor order transition from ${vo.status} to ${status}`});
  db.prepare("UPDATE vendor_orders SET status=?,delivery_status=?,updated_at=datetime('now') WHERE id=?").run(status,status==='Shipped'?'Ready for Pickup':vo.delivery_status,vo.id);
  recomputeParentOrderStatus(req.params.id);
 }else{
  const previous=(db.prepare('SELECT status FROM orders WHERE id=?').get(req.params.id) as any)?.status;
  db.prepare('UPDATE orders SET status=? WHERE id=?').run(status,req.params.id);
  db.prepare("UPDATE vendor_orders SET status=?,updated_at=datetime('now') WHERE order_id=?").run(status,req.params.id);
  if(status==='Delivered'&&previous!=='Delivered')recordVendorLedgerForDeliveredOrder(req.params.id);
 }
 notifyOrderParties(req.params.id, `Order ${status}`, `Order ${req.params.id} is now ${status.toLowerCase()}.`, 'order');
 res.json(loadOrder(req.params.id));
});

export default router;
