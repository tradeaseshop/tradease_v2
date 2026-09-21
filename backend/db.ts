import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const appDir = path.join(process.cwd(), 'backend');

const DB_PATH = process.env.DATABASE_PATH || path.join(appDir, 'tradeease.db');

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');
db.pragma('busy_timeout = 5000');

const schema = fs.readFileSync(path.join(appDir, 'schema.sql'), 'utf-8');
db.exec(schema);

// Safety net for databases created before these columns existed (CREATE TABLE
// IF NOT EXISTS won't add columns to an already-existing table). Each ALTER
// is wrapped individually since SQLite throws if the column is already
// there, and we want the rest of the migrations to still run either way.
const migrations = [
  `ALTER TABLE users ADD COLUMN auth_provider TEXT NOT NULL DEFAULT 'local'`,
  `ALTER TABLE orders ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'wallet'`,
  `ALTER TABLE orders ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'Pending'`,
  `ALTER TABLE orders ADD COLUMN payment_reference TEXT`,
  `ALTER TABLE vendors ADD COLUMN kyc_status TEXT NOT NULL DEFAULT 'Unverified'`,
  `ALTER TABLE vendors ADD COLUMN commission_percent REAL`,
  `ALTER TABLE products ADD COLUMN commission_percent REAL`,
  `ALTER TABLE products ADD COLUMN images TEXT`,
  `ALTER TABLE products ADD COLUMN specifications TEXT`,
  `ALTER TABLE order_items ADD COLUMN digital_format TEXT`,
  `ALTER TABLE products ADD COLUMN subcategory TEXT`,
  `ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE users ADD COLUMN email_verification_code TEXT`,
  `ALTER TABLE users ADD COLUMN email_verification_expires TEXT`,
  `ALTER TABLE users ADD COLUMN totp_secret TEXT`,
  `ALTER TABLE users ADD COLUMN totp_enabled INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE admins ADD COLUMN avatar TEXT`,
  `ALTER TABLE admins ADD COLUMN totp_secret TEXT`,
  `ALTER TABLE admins ADD COLUMN totp_enabled INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE vendors ADD COLUMN logo TEXT`,
  `ALTER TABLE orders ADD COLUMN server_subtotal REAL NOT NULL DEFAULT 0`,
  `ALTER TABLE orders ADD COLUMN quote_shipping_cost REAL NOT NULL DEFAULT 0`,
  `ALTER TABLE vendors ADD COLUMN account_status TEXT NOT NULL DEFAULT 'Active'`,
  `ALTER TABLE vendors ADD COLUMN store_status TEXT NOT NULL DEFAULT 'Pending'`,
  `ALTER TABLE vendors ADD COLUMN payout_status TEXT NOT NULL DEFAULT 'On Hold'`,
  `ALTER TABLE vendors ADD COLUMN suspension_reason TEXT`,
  `ALTER TABLE order_items ADD COLUMN vendor_id TEXT`,
  `CREATE INDEX IF NOT EXISTS idx_orders_buyer_date ON orders(buyer_id, date)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status, date)`,
  `CREATE INDEX IF NOT EXISTS idx_order_items_vendor ON order_items(vendor_id, order_id)`,
];
for (const sql of migrations) {
  try {
    db.exec(sql);
  } catch {
    // Column already exists — fine, nothing to do.
  }
}
try { db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_payment_reference_unique ON orders(payment_reference) WHERE payment_reference IS NOT NULL'); } catch {}
try {
  const taxonomy = [['fashion-apparel','Fashion & Apparel','Shirt',0],['electronics-gadgets','Electronics & Gadgets','Smartphone',1],['home-kitchen','Home & Kitchen','Home',2],['beauty-health-personal-care','Beauty, Health & Personal Care','Sparkles',3],['grocery-food','Grocery & Food','Utensils',4],['automotive','Automotive','Car',5],['baby-kids','Baby & Kids','Baby',6],['sports-fitness','Sports & Fitness','Dumbbell',7],['industrial-tools','Industrial & Tools','Wrench',8],['office-stationery','Office & Stationery','Printer',9],['books-media','Books & Media','BookOpen',10],['services-digital-products','Services & Digital Products','Download',11],['agriculture-farm','Agriculture & Farm','Wheat',12],['handmade-custom','Handmade & Custom','Palette',13]];
  const upsert=db.prepare(`INSERT INTO categories(id,name,icon_name,color,display_order) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,icon_name=excluded.icon_name,display_order=excluded.display_order`);
  for(const c of taxonomy) upsert.run(c[0],c[1],c[2],null,c[3]);
  const legacy={electronics:'electronics-gadgets',fashion:'fashion-apparel',home:'home-kitchen',beauty:'beauty-health-personal-care',food:'grocery-food',ebooks:'services-digital-products'};
  for(const [oldId,newId] of Object.entries(legacy)) db.prepare('UPDATE products SET category=? WHERE category=?').run(newId,oldId);
} catch(e) { console.warn('[db] catalog taxonomy migration warning:',e); }


// Where uploaded KYC documents (ID photos, proof-of-address files) are
// stored on disk. Created on startup if it doesn't exist yet.

try {
  db.exec("UPDATE vendors SET store_status='Active', account_status='Active' WHERE status='Approved' AND account_status='Active' AND store_status='Pending'");
  db.exec("UPDATE order_items SET vendor_id = (SELECT vendor_id FROM products p WHERE p.id = order_items.product_id) WHERE vendor_id IS NULL");
  const rows = db.prepare("SELECT o.id AS order_id, oi.vendor_id, SUM(oi.price*oi.quantity) AS subtotal FROM orders o JOIN order_items oi ON oi.order_id=o.id WHERE oi.vendor_id IS NOT NULL GROUP BY o.id, oi.vendor_id").all() as any[];
  const platform = db.prepare('SELECT commission_percent FROM platform_settings WHERE id=1').get() as any;
  const platformRate = platform?.commission_percent ?? 8;
  for (const r of rows) {
    const vendor = db.prepare('SELECT commission_percent FROM vendors WHERE id=?').get(r.vendor_id) as any;
    const rate = vendor?.commission_percent ?? platformRate;
    const subtotal = Number(r.subtotal || 0); const commission = Math.round(subtotal*rate) / 100; const earnings = Math.round((subtotal-commission)*100)/100;
    const void_ = `VO-${r.order_id}-${r.vendor_id}`;
    const orderStatus = (db.prepare('SELECT status FROM orders WHERE id=?').get(r.order_id) as any)?.status || 'Pending';
    db.prepare("INSERT OR IGNORE INTO vendor_orders(id,order_id,vendor_id,status,subtotal,commission_amount,vendor_earnings) VALUES(?,?,?,?,?,?,?)").run(void_,r.order_id,r.vendor_id,orderStatus,subtotal,commission,earnings);
    db.prepare("UPDATE vendor_orders SET subtotal=?, commission_amount=?, vendor_earnings=?, status=?, updated_at=datetime('now') WHERE id=?").run(subtotal,commission,earnings,orderStatus,void_);
    if (orderStatus === 'Delivered') db.prepare("INSERT OR IGNORE INTO vendor_ledger(id,vendor_id,order_id,vendor_order_id,entry_type,direction,amount,description) VALUES(?,?,?,?,?,?,?,?)").run(`LED-${r.order_id}-${r.vendor_id}`,r.vendor_id,r.order_id,void_,'Sale','credit',earnings,'Vendor earnings from delivered order');
  }
} catch (e) { console.warn('[db] V3 backfill warning:', e); }

export const PRODUCT_IMAGE_UPLOAD_DIR = path.join(appDir, 'uploads', 'products');
fs.mkdirSync(PRODUCT_IMAGE_UPLOAD_DIR, { recursive: true });

export const EBOOK_UPLOAD_DIR = path.join(appDir, 'uploads', 'ebooks');
fs.mkdirSync(EBOOK_UPLOAD_DIR, { recursive: true });

export const KYC_UPLOAD_DIR = path.join(appDir, 'uploads', 'kyc');
fs.mkdirSync(KYC_UPLOAD_DIR, { recursive: true });

// Where profile pictures and vendor brand/logo images are stored. Unlike
// KYC documents, these are meant to be publicly visible (a buyer browsing
// a vendor's store sees their logo), so this directory is served directly
// as static files rather than through an authenticated endpoint.
export const AVATAR_UPLOAD_DIR = path.join(appDir, 'uploads', 'avatars');
fs.mkdirSync(AVATAR_UPLOAD_DIR, { recursive: true });

export default db;
