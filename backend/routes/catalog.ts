import { Router } from 'express';
import { randomUUID } from 'crypto';
import path from 'path';
import db from '../db';
import { toProduct, toCategory } from '../serialize';
import { requireAuth, requireRole } from '../auth';
import { SUBCATEGORY_BY_ID, CATALOG_BY_ID } from '../../src/catalogTaxonomy';
import { uploadProductImages, productImageUrlFor, MAX_PRODUCT_IMAGES } from '../uploadProductImage';
import { uploadEbookFile } from '../uploadEbook';
import { EBOOK_UPLOAD_DIR } from '../db';

const router = Router();

// GET /api/categories
router.get('/categories', (_req, res) => {
  const rows = db.prepare('SELECT * FROM categories ORDER BY display_order ASC').all();
  res.json(rows.map(toCategory));
});

// GET /api/products?category=&vendorId=&featured=1&search=
router.get('/products', (req, res) => {
  const { category, subcategory, vendorId, featured, search } = req.query as Record<string, string | undefined>;
  let sql = 'SELECT * FROM products WHERE 1=1';
  const params: any[] = [];
  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  if (subcategory) {
    sql += ' AND subcategory = ?';
    params.push(subcategory);
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
  const vendor = req.auth!.role === 'vendor' ? db.prepare('SELECT id, name FROM vendors WHERE user_id = ?').get(req.auth!.id) as any : null;
  if (req.auth!.role === 'vendor' && !vendor) return res.status(403).json({ error: 'Vendor profile not found' });
  const effectiveVendorId = req.auth!.role === 'admin' ? (b.vendorId || null) : vendor.id;
  const effectiveVendorName = req.auth!.role === 'admin' ? (b.vendorName || null) : vendor.name;
  const categoryId=String(b.category||'').trim(); const subcategoryId=String(b.subcategory||'').trim();
  if(!CATALOG_BY_ID[categoryId]) return res.status(400).json({error:'A valid product category is required'});
  if(!SUBCATEGORY_BY_ID[subcategoryId] || SUBCATEGORY_BY_ID[subcategoryId].categoryId!==categoryId) return res.status(400).json({error:'Please select a valid subcategory for the selected category'});
  db.prepare(
    `INSERT INTO products
      (id, title, price, original_price, image, rating, reviews_count, category, subcategory, description, vendor_name, vendor_id, is_featured, stock, digital_spec)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    b.title,
    b.price,
    b.originalPrice ?? b.price,
    b.image || null,
    b.rating ?? 0,
    b.reviewsCount ?? 0,
    categoryId,
    subcategoryId,
    b.description || null,
    effectiveVendorName,
    effectiveVendorId,
    req.auth!.role === 'admin' && b.isFeatured ? 1 : 0,
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
  if (req.auth!.role === 'vendor') {
    const vendor = db.prepare('SELECT id, name FROM vendors WHERE user_id = ?').get(req.auth!.id) as any;
    if (!vendor || existing.vendor_id !== vendor.id) return res.status(403).json({ error: 'You can only edit your own products' });
  }
  const b = req.body || {};
  const categoryId = String(b.category ?? existing.category ?? '').trim();
  const subcategoryId = String(b.subcategory ?? existing.subcategory ?? '').trim();
  if (!CATALOG_BY_ID[categoryId] || !SUBCATEGORY_BY_ID[subcategoryId] || SUBCATEGORY_BY_ID[subcategoryId].categoryId !== categoryId) return res.status(400).json({ error: 'Valid category and matching subcategory are required' });
  db.prepare(
    `UPDATE products SET
      title = ?, price = ?, original_price = ?, image = ?, rating = ?, reviews_count = ?,
      category = ?, subcategory = ?, description = ?, vendor_name = ?, is_featured = ?, stock = ?, digital_spec = ?,
      updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    b.title ?? existing.title,
    b.price ?? existing.price,
    b.originalPrice ?? existing.original_price,
    b.image ?? existing.image,
    b.rating ?? existing.rating,
    b.reviewsCount ?? existing.reviews_count,
    categoryId,
    subcategoryId,
    b.description ?? existing.description,
    req.auth!.role === 'admin' ? (b.vendorName ?? existing.vendor_name) : existing.vendor_name,
    req.auth!.role === 'admin' ? (b.isFeatured != null ? (b.isFeatured ? 1 : 0) : existing.is_featured) : existing.is_featured,
    b.stock ?? existing.stock,
    b.digitalSpecification ? JSON.stringify(b.digitalSpecification) : existing.digital_spec,
    req.params.id
  );
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  res.json(toProduct(row));
});

// POST /api/products/:id/images  (owning vendor or admin, multipart, field
// name "images", up to 10 files) — appends newly uploaded photos to
// whatever images this product already has, capped at 10 total.
router.post('/products/:id/images', requireRole('vendor', 'admin'), uploadProductImages.array('images', MAX_PRODUCT_IMAGES), (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id) as any;
  if (!existing) return res.status(404).json({ error: 'Product not found' });
  if (req.auth!.role === 'vendor' && existing.vendor_id !== req.auth!.id) {
    return res.status(403).json({ error: 'You can only edit your own products' });
  }
  const files = (req.files as Express.Multer.File[]) || [];
  if (files.length === 0) return res.status(400).json({ error: 'No images were uploaded.' });

  const currentImages: string[] = existing.images ? JSON.parse(existing.images) : [];
  const newUrls = files.map((f) => productImageUrlFor(f.filename));
  const merged = [...currentImages, ...newUrls].slice(0, MAX_PRODUCT_IMAGES);

  // First image uploaded overall becomes the primary/cover image too, if
  // there wasn't one already.
  const primaryImage = existing.image || merged[0];

  db.prepare(`UPDATE products SET image = ?, images = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(primaryImage, JSON.stringify(merged), req.params.id);

  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  res.json(toProduct(row));
});

// DELETE /api/products/:id/images  { url }  (owning vendor or admin) —
// removes one image from this product's gallery.
router.delete('/products/:id/images', requireRole('vendor', 'admin'), (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id) as any;
  if (!existing) return res.status(404).json({ error: 'Product not found' });
  if (req.auth!.role === 'vendor' && existing.vendor_id !== req.auth!.id) {
    return res.status(403).json({ error: 'You can only edit your own products' });
  }
  const { url } = req.body || {};
  const currentImages: string[] = existing.images ? JSON.parse(existing.images) : [];
  const filtered = currentImages.filter((u) => u !== url);
  const newPrimary = existing.image === url ? (filtered[0] || null) : existing.image;

  db.prepare(`UPDATE products SET image = ?, images = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(newPrimary, JSON.stringify(filtered), req.params.id);

  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  res.json(toProduct(row));
});

// POST /api/products/:id/ebook  (owning vendor or admin, multipart, field
// names "epub" and/or "pdf") — uploads the actual ebook file(s) for a
// digital product. A vendor can upload either format, or both, so a buyer
// can choose which one they want at checkout.
router.post(
  '/products/:id/ebook',
  requireRole('vendor', 'admin'),
  uploadEbookFile.fields([{ name: 'epub', maxCount: 1 }, { name: 'pdf', maxCount: 1 }]),
  (req, res) => {
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id) as any;
    if (!existing) return res.status(404).json({ error: 'Product not found' });
    if (req.auth!.role === 'vendor' && existing.vendor_id !== req.auth!.id) {
      return res.status(403).json({ error: 'You can only edit your own products' });
    }
    const files = req.files as { epub?: Express.Multer.File[]; pdf?: Express.Multer.File[] } | undefined;
    if (!files || (!files.epub && !files.pdf)) {
      return res.status(400).json({ error: 'Upload at least one file: epub and/or pdf.' });
    }

    const spec = existing.digital_spec ? JSON.parse(existing.digital_spec) : {};
    if (files.epub?.[0]) spec.epubFileName = files.epub[0].filename;
    if (files.pdf?.[0]) spec.pdfFileName = files.pdf[0].filename;
    // Kept for older UI that still reads a single fileType; now informational —
    // the buyer picks their preferred format at checkout when both exist.
    spec.fileType = spec.epubFileName && spec.pdfFileName ? 'PDF' : (spec.epubFileName ? 'EPUB' : 'PDF');

    db.prepare(`UPDATE products SET digital_spec = ?, updated_at = datetime('now') WHERE id = ?`)
      .run(JSON.stringify(spec), req.params.id);

    const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    res.json(toProduct(row));
  }
);

// GET /api/products/:id/ebook/:format  ('epub' | 'pdf')  — download the
// actual ebook file. Requires the requester to have a Delivered or Paid
// order containing this product (or to be the vendor who owns it, or an
// admin), so purchasing is what actually unlocks the file, not just being
// logged in.
router.get('/products/:id/ebook/:format', requireAuth, (req, res) => {
  const format = req.params.format.toLowerCase();
  if (format !== 'epub' && format !== 'pdf') {
    return res.status(400).json({ error: 'format must be epub or pdf' });
  }
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id) as any;
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const spec = product.digital_spec ? JSON.parse(product.digital_spec) : {};
  const storedFileName = format === 'epub' ? spec.epubFileName : spec.pdfFileName;
  if (!storedFileName) {
    return res.status(404).json({ error: `This product doesn't have a ${format.toUpperCase()} file available.` });
  }

  const isOwnerOrAdmin = req.auth!.role === 'admin' || (req.auth!.role === 'vendor' && product.vendor_id === req.auth!.id);
  if (!isOwnerOrAdmin) {
    const purchase = db.prepare(
      `SELECT o.id FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       WHERE o.user_id = ? AND oi.product_id = ? AND o.status IN ('Delivered', 'Paid')
       LIMIT 1`
    ).get(req.auth!.id, req.params.id);
    if (!purchase) {
      return res.status(403).json({ error: 'Purchase this product to download it.' });
    }
  }

  const filePath = path.join(EBOOK_UPLOAD_DIR, storedFileName);
  res.download(filePath, `${product.title}.${format}`);
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
  if (req.auth!.role === 'vendor') {
    const vendor = db.prepare('SELECT id FROM vendors WHERE user_id = ?').get(req.auth!.id) as any;
    if (!vendor || existing.vendor_id !== vendor.id) return res.status(403).json({ error: 'You can only remove your own products' });
  }
  db.prepare(`UPDATE products SET stock = 0, updated_at = datetime('now') WHERE id = ?`).run(req.params.id);
  res.json({ success: true });
});

export default router;
