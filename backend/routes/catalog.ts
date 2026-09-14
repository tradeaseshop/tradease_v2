import { Router } from 'express';
import { randomUUID } from 'crypto';
import db from '../db';
import { toProduct, toCategory } from '../serialize';
import { requireAuth, requireRole } from '../auth';

const router = Router();

// GET /api/categories
router.get('/categories', (_req, res) => {
  const rows = db.prepare('SELECT * FROM categories ORDER BY display_order ASC').all();
  res.json(rows.map(toCategory));
});

// GET /api/products?category=&vendorId=&featured=1&search=
router.get('/products', (req, res) => {
  const { category, vendorId, featured, search } = req.query as Record<string, string | undefined>;
  let sql = 'SELECT * FROM products WHERE 1=1';
  const params: any[] = [];
  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  if (vendorId) {
    sql += ' AND vendor_id = ?';
    params.push(vendorId);
  }
  if (featured) {
    sql += ' AND is_featured = 1';
  }
  if (search) {
    sql += ' AND (title LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  sql += ' ORDER BY created_at DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(toProduct));
});

// GET /api/products/:id
router.get('/products/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Product not found' });
  res.json(toProduct(row));
});

// POST /api/products  (vendor or admin)
router.post('/products', requireRole('vendor', 'admin'), (req, res) => {
  const b = req.body || {};
  if (!b.title || b.price == null) {
    return res.status(400).json({ error: 'title and price are required' });
  }
  const id = b.id || randomUUID();
  db.prepare(
    `INSERT INTO products
      (id, title, price, original_price, image, rating, reviews_count, category, description, vendor_name, vendor_id, is_featured, stock, digital_spec)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    b.title,
    b.price,
    b.originalPrice ?? b.price,
    b.image || null,
    b.rating ?? 0,
    b.reviewsCount ?? 0,
    b.category || null,
    b.description || null,
    b.vendorName || null,
    b.vendorId || req.auth!.id,
    b.isFeatured ? 1 : 0,
    b.stock ?? 0,
    b.digitalSpecification ? JSON.stringify(b.digitalSpecification) : null
  );
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  res.status(201).json(toProduct(row));
});

// PUT /api/products/:id  (owning vendor or admin)
router.put('/products/:id', requireRole('vendor', 'admin'), (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id) as any;
  if (!existing) return res.status(404).json({ error: 'Product not found' });
  if (req.auth!.role === 'vendor' && existing.vendor_id !== req.auth!.id) {
    return res.status(403).json({ error: 'You can only edit your own products' });
  }
  const b = req.body || {};
  db.prepare(
    `UPDATE products SET
      title = ?, price = ?, original_price = ?, image = ?, rating = ?, reviews_count = ?,
      category = ?, description = ?, vendor_name = ?, is_featured = ?, stock = ?, digital_spec = ?,
      updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    b.title ?? existing.title,
    b.price ?? existing.price,
    b.originalPrice ?? existing.original_price,
    b.image ?? existing.image,
    b.rating ?? existing.rating,
    b.reviewsCount ?? existing.reviews_count,
    b.category ?? existing.category,
    b.description ?? existing.description,
    b.vendorName ?? existing.vendor_name,
    b.isFeatured != null ? (b.isFeatured ? 1 : 0) : existing.is_featured,
    b.stock ?? existing.stock,
    b.digitalSpecification ? JSON.stringify(b.digitalSpecification) : existing.digital_spec,
    req.params.id
  );
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  res.json(toProduct(row));
});

// PUT /api/products/:id/commission  (admin only) — set (or clear, with
// null) a custom commission rate for this specific product, overriding
// both the vendor's rate and the platform default. Deliberately a separate
// route from the general product edit above (which vendors can also use)
// so a vendor editing their own listing can never touch their own cut.
router.put('/products/:id/commission', requireRole('admin'), (req, res) => {
  const { commissionPercent } = req.body || {};
  if (commissionPercent !== null && (typeof commissionPercent !== 'number' || commissionPercent < 0 || commissionPercent > 100)) {
    return res.status(400).json({ error: 'commissionPercent must be a number between 0 and 100, or null to clear the override' });
  }
  const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Product not found' });
  db.prepare(`UPDATE products SET commission_percent = ?, updated_at = datetime('now') WHERE id = ?`).run(commissionPercent, req.params.id);
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  res.json(toProduct(row));
});

// DELETE /api/products/:id  (owning vendor or admin) - soft delete (stock -> 0), matches
// the frontend's existing "delisting" behavior rather than a hard destructive delete.
router.delete('/products/:id', requireRole('vendor', 'admin'), (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id) as any;
  if (!existing) return res.status(404).json({ error: 'Product not found' });
  if (req.auth!.role === 'vendor' && existing.vendor_id !== req.auth!.id) {
    return res.status(403).json({ error: 'You can only remove your own products' });
  }
  db.prepare(`UPDATE products SET stock = 0, updated_at = datetime('now') WHERE id = ?`).run(req.params.id);
  res.json({ success: true });
});

export default router;
