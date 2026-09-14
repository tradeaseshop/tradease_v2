-- TradeEase backend schema (SQLite)
-- Evolved from Suremart's MySQL schema (mart.sql), extended with the
-- multi-vendor / logistics / support-chat concepts TradeEase's frontend expects.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('buyer','vendor')) DEFAULT 'buyer',
  avatar TEXT,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Suspended')),
  total_orders INTEGER NOT NULL DEFAULT 0,
  total_spent REAL NOT NULL DEFAULT 0,
  auth_provider TEXT NOT NULL DEFAULT 'local' CHECK (auth_provider IN ('local','google')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'Admin',
  phone TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS vendors (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Approved','Pending','Rejected')),
  store_category TEXT,
  rating REAL NOT NULL DEFAULT 0,
  joining_date TEXT NOT NULL DEFAULT (datetime('now')),
  kyc_status TEXT NOT NULL DEFAULT 'Unverified' CHECK (kyc_status IN ('Unverified','Pending','Verified','Rejected')),
  -- NULL means "use the platform's global commission rate" (see
  -- platform_settings.commission_percent). Set by an admin to give this
  -- vendor a custom rate instead.
  commission_percent REAL
);

-- KYC documents vendors upload to verify their identity (ID) and business
-- address (utility bill / bank statement / CAC certificate, etc). Files
-- themselves live on disk under backend/uploads/kyc/ — this table only
-- tracks metadata and review status.
CREATE TABLE IF NOT EXISTS kyc_documents (
  id TEXT PRIMARY KEY,
  vendor_id TEXT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('id','address')),
  original_file_name TEXT NOT NULL,
  stored_file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Approved','Rejected')),
  rejection_reason TEXT,
  uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
  reviewed_at TEXT,
  reviewed_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_kyc_documents_vendor ON kyc_documents(vendor_id);


CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon_name TEXT,
  color TEXT,
  display_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  price REAL NOT NULL,
  original_price REAL NOT NULL DEFAULT 0,
  image TEXT,
  rating REAL NOT NULL DEFAULT 0,
  reviews_count INTEGER NOT NULL DEFAULT 0,
  category TEXT REFERENCES categories(id),
  description TEXT,
  vendor_name TEXT,
  vendor_id TEXT REFERENCES vendors(id),
  is_featured INTEGER NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  digital_spec TEXT,
  -- NULL means "use this product's vendor rate, or the platform default if
  -- the vendor has no override either." Set by an admin for a custom rate
  -- on this specific product.
  commission_percent REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS delivery_zones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  zone_name TEXT NOT NULL,
  fee REAL NOT NULL DEFAULT 0,
  is_free INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS logistics_providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  api_endpoint TEXT,
  api_key TEXT,
  webhook_url TEXT,
  webhook_secret TEXT,
  base_fee REAL NOT NULL DEFAULT 0,
  per_km_rate REAL NOT NULL DEFAULT 0,
  estimated_days TEXT,
  badge TEXT,
  description TEXT,
  rating REAL NOT NULL DEFAULT 0,
  supported_services TEXT,
  tracking_url_template TEXT
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  buyer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  buyer_name TEXT NOT NULL,
  buyer_phone TEXT,
  city TEXT,
  state TEXT,
  address TEXT,
  total_amount REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Processing','Shipped','Delivered','Cancelled')),
  date TEXT NOT NULL DEFAULT (datetime('now')),
  shipping_method TEXT,
  shipping_cost REAL NOT NULL DEFAULT 0,
  logistics_provider_id TEXT,
  logistics_provider_name TEXT,
  tracking_number TEXT,
  carrier_status TEXT,
  deliveri_tracking_number TEXT,
  deliveri_status TEXT,
  payment_method TEXT NOT NULL DEFAULT 'wallet' CHECK (payment_method IN ('wallet','bank','card')),
  payment_status TEXT NOT NULL DEFAULT 'Pending' CHECK (payment_status IN ('Pending','Paid','Failed')),
  payment_reference TEXT
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT,
  product_title TEXT,
  price REAL NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  image TEXT
);

-- A vendor's request to withdraw their available balance (earnings from
-- delivered orders, net of platform commission) to their bank account.
-- 'Pending' and 'Approved' both count against the vendor's available
-- balance so they can't request the same money twice; only 'Rejected'
-- releases it back.
CREATE TABLE IF NOT EXISTS withdrawals (
  id TEXT PRIMARY KEY,
  vendor_id TEXT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Approved','Rejected','Paid')),
  bank_name TEXT,
  account_number TEXT,
  account_name TEXT,
  notes TEXT,
  requested_at TEXT NOT NULL DEFAULT (datetime('now')),
  processed_at TEXT,
  processed_by TEXT
);

CREATE TABLE IF NOT EXISTS support_chats (
  id TEXT PRIMARY KEY,
  user_name TEXT,
  user_role TEXT,
  user_email TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','resolved')),
  last_message_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS support_messages (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL REFERENCES support_chats(id) ON DELETE CASCADE,
  sender TEXT NOT NULL,
  sender_name TEXT,
  content TEXT NOT NULL,
  timestamp TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_vendor ON products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_chat ON support_messages(chat_id);

-- Platform-wide configuration. Always exactly one row (id = 1) — this is a
-- singleton settings table, not a per-user table.
CREATE TABLE IF NOT EXISTS platform_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  app_name TEXT NOT NULL DEFAULT 'TradeEase',
  commission_percent REAL NOT NULL DEFAULT 8,
  payment_gateway TEXT NOT NULL DEFAULT 'Paystack' CHECK (payment_gateway IN ('Paystack','Flutterwave','Dual')),
  test_mode INTEGER NOT NULL DEFAULT 1,
  payout_frequency TEXT NOT NULL DEFAULT 'Weekly' CHECK (payout_frequency IN ('Daily','Weekly','Monthly')),
  flat_delivery_fee REAL NOT NULL DEFAULT 1500,
  restricted_categories TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT OR IGNORE INTO platform_settings (id) VALUES (1);

-- Disputes / complaints the admin team tracks and resolves (product
-- disputes, failed payouts, seller fraud reports, delivery complaints).
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  reporter_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Product Dispute','Failed Payout','Seller Fraud','Delivery Complaint')),
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open','Investigating','Resolved')),
  description TEXT,
  date TEXT NOT NULL DEFAULT (datetime('now'))
);

