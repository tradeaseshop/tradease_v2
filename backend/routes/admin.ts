import { Router } from 'express';
import { randomUUID } from 'crypto';
import db from '../db';
import { toAdminUser, toAdminVendor, toDeliveryZone, toLogisticsProvider } from '../serialize';
import { requireRole } from '../auth';

const router = Router();

// ---------- Users ----------

router.get('/users', requireRole('admin'), (_req, res) => {
  const rows = db.prepare("SELECT * FROM users ORDER BY created_at DESC").all();
  res.json(rows.map(toAdminUser));
});

router.put('/users/:id/status', requireRole('admin'), (req, res) => {
  const { status } = req.body || {};
  if (!['Active', 'Suspended'].includes(status)) {
    return res.status(400).json({ error: 'status must be Active or Suspended' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'User not found' });
  db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json(toAdminUser(db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id)));
});

router.delete('/users/:id', requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ---------- Vendors ----------

router.get('/vendors', requireRole('admin'), (_req, res) => {
  const rows = db
    .prepare(
      `SELECT v.*,
        (SELECT COUNT(*) FROM products p WHERE p.vendor_id = v.id) AS total_products,
        (SELECT COALESCE(SUM(oi.price * oi.quantity), 0)
           FROM order_items oi JOIN products p ON p.id = oi.product_id
           WHERE p.vendor_id = v.id) AS total_sales
       FROM vendors v ORDER BY v.joining_date DESC`
    )
    .all();
  res.json(rows.map(toAdminVendor));
});

router.put('/vendors/:id/status', requireRole('admin'), (req, res) => {
  const { status } = req.body || {};
  if (!['Approved', 'Pending', 'Rejected'].includes(status)) {
    return res.status(400).json({ error: 'status must be Approved, Pending or Rejected' });
  }
  const existing = db.prepare('SELECT id FROM vendors WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Vendor not found' });
  db.prepare('UPDATE vendors SET status = ? WHERE id = ?').run(status, req.params.id);
  const row = db.prepare('SELECT * FROM vendors WHERE id = ?').get(req.params.id) as any;
  res.json(toAdminVendor(row));
});

// PUT /api/admin/vendors/:id/commission  (admin) — set (or clear, with
// null) a custom commission rate for this vendor, overriding the platform
// default for every product of theirs that doesn't have its own override.
router.put('/vendors/:id/commission', requireRole('admin'), (req, res) => {
  const { commissionPercent } = req.body || {};
  if (commissionPercent !== null && (typeof commissionPercent !== 'number' || commissionPercent < 0 || commissionPercent > 100)) {
    return res.status(400).json({ error: 'commissionPercent must be a number between 0 and 100, or null to clear the override' });
  }
  const existing = db.prepare('SELECT id FROM vendors WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Vendor not found' });
  db.prepare('UPDATE vendors SET commission_percent = ? WHERE id = ?').run(commissionPercent, req.params.id);
  const row = db.prepare('SELECT * FROM vendors WHERE id = ?').get(req.params.id) as any;
  res.json(toAdminVendor(row));
});

// ---------- Delivery zones (flat-fee shipping zones, carried over from Suremart) ----------

router.get('/delivery-zones', (_req, res) => {
  const rows = db.prepare('SELECT * FROM delivery_zones WHERE is_active = 1 ORDER BY zone_name').all();
  res.json(rows.map(toDeliveryZone));
});

// GET /api/delivery-zones/all  (admin) — includes inactive zones too, so the
// admin screen can show and re-enable zones that were toggled off, not just
// the ones currently live on checkout.
router.get('/delivery-zones/all', requireRole('admin'), (_req, res) => {
  const rows = db.prepare('SELECT * FROM delivery_zones ORDER BY zone_name').all();
  res.json(rows.map(toDeliveryZone));
});

router.post('/delivery-zones', requireRole('admin'), (req, res) => {
  const b = req.body || {};
  if (!b.zoneName) return res.status(400).json({ error: 'zoneName is required' });
  const info = db
    .prepare('INSERT INTO delivery_zones (zone_name, fee, is_free, is_active) VALUES (?, ?, ?, 1)')
    .run(b.zoneName, b.fee ?? 0, b.isFree ? 1 : 0);
  res.status(201).json(toDeliveryZone(db.prepare('SELECT * FROM delivery_zones WHERE id = ?').get(info.lastInsertRowid)));
});

router.put('/delivery-zones/:id', requireRole('admin'), (req, res) => {
  const b = req.body || {};
  const existing = db.prepare('SELECT * FROM delivery_zones WHERE id = ?').get(req.params.id) as any;
  if (!existing) return res.status(404).json({ error: 'Zone not found' });
  db.prepare('UPDATE delivery_zones SET zone_name = ?, fee = ?, is_free = ?, is_active = ? WHERE id = ?').run(
    b.zoneName ?? existing.zone_name,
    b.fee ?? existing.fee,
    b.isFree != null ? (b.isFree ? 1 : 0) : existing.is_free,
    b.isActive != null ? (b.isActive ? 1 : 0) : existing.is_active,
    req.params.id
  );
  res.json(toDeliveryZone(db.prepare('SELECT * FROM delivery_zones WHERE id = ?').get(req.params.id)));
});

router.delete('/delivery-zones/:id', requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM delivery_zones WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ---------- Logistics providers ----------

router.get('/logistics-providers', (_req, res) => {
  const rows = db.prepare('SELECT * FROM logistics_providers').all();
  res.json(rows.map(toLogisticsProvider));
});

router.post('/logistics-providers', requireRole('admin'), (req, res) => {
  const b = req.body || {};
  if (!b.name || !b.code) return res.status(400).json({ error: 'name and code are required' });
  const id = b.id || `provider-${randomUUID().slice(0, 8)}`;
  db.prepare(
    `INSERT INTO logistics_providers
      (id, name, code, type, status, api_endpoint, api_key, webhook_url, webhook_secret, base_fee,
       per_km_rate, estimated_days, badge, description, rating, supported_services, tracking_url_template)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    b.name,
    b.code,
    b.type || 'API',
    b.status || 'active',
    b.apiEndpoint || null,
    b.apiKey || null,
    b.webhookUrl || null,
    b.webhookSecret || null,
    b.baseFee ?? 0,
    b.perKmRate ?? 0,
    b.estimatedDays || null,
    b.badge || null,
    b.description || null,
    b.rating ?? 0,
    JSON.stringify(b.supportedServices || []),
    b.trackingUrlTemplate || null
  );
  res.status(201).json(toLogisticsProvider(db.prepare('SELECT * FROM logistics_providers WHERE id = ?').get(id)));
});

router.put('/logistics-providers/:id', requireRole('admin'), (req, res) => {
  const existing = db.prepare('SELECT * FROM logistics_providers WHERE id = ?').get(req.params.id) as any;
  if (!existing) return res.status(404).json({ error: 'Provider not found' });
  const b = req.body || {};
  db.prepare(
    `UPDATE logistics_providers SET name=?, code=?, type=?, status=?, api_endpoint=?, api_key=?, webhook_url=?,
      webhook_secret=?, base_fee=?, per_km_rate=?, estimated_days=?, badge=?, description=?, rating=?,
      supported_services=?, tracking_url_template=? WHERE id=?`
  ).run(
    b.name ?? existing.name,
    b.code ?? existing.code,
    b.type ?? existing.type,
    b.status ?? existing.status,
    b.apiEndpoint ?? existing.api_endpoint,
    b.apiKey ?? existing.api_key,
    b.webhookUrl ?? existing.webhook_url,
    b.webhookSecret ?? existing.webhook_secret,
    b.baseFee ?? existing.base_fee,
    b.perKmRate ?? existing.per_km_rate,
    b.estimatedDays ?? existing.estimated_days,
    b.badge ?? existing.badge,
    b.description ?? existing.description,
    b.rating ?? existing.rating,
    b.supportedServices ? JSON.stringify(b.supportedServices) : existing.supported_services,
    b.trackingUrlTemplate ?? existing.tracking_url_template,
    req.params.id
  );
  res.json(toLogisticsProvider(db.prepare('SELECT * FROM logistics_providers WHERE id = ?').get(req.params.id)));
});

router.delete('/logistics-providers/:id', requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM logistics_providers WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ---------- Dashboard summary ----------

router.get('/stats', requireRole('admin'), (_req, res) => {
  const totalUsers = (db.prepare("SELECT COUNT(*) c FROM users WHERE role='buyer'").get() as any).c;
  const totalVendors = (db.prepare('SELECT COUNT(*) c FROM vendors').get() as any).c;
  const totalProducts = (db.prepare('SELECT COUNT(*) c FROM products').get() as any).c;
  const totalOrders = (db.prepare('SELECT COUNT(*) c FROM orders').get() as any).c;
  const totalRevenue = (db.prepare("SELECT COALESCE(SUM(total_amount),0) s FROM orders WHERE status != 'Cancelled'").get() as any).s;
  res.json({ totalUsers, totalVendors, totalProducts, totalOrders, totalRevenue });
});

export default router;
