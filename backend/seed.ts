/**
 * Seeds the SQLite database from:
 *  - TradeEase's existing frontend mock data (products, categories, orders,
 *    logistics providers, admin users/vendors) so the app looks the same on
 *    first run as it did against the old mock/Firebase data.
 *  - Suremart's original grocery catalog (mart.sql), migrated in as real
 *    products belonging to a "Suremart Grocery" vendor, plus its delivery
 *    zones — proving the Suremart -> TradeEase data migration end to end.
 *
 * Run with: npx tsx backend/seed.ts
 */
import { randomUUID } from 'crypto';
import db from './db';
import { hashPassword } from './auth';
import { ALL_PRODUCTS } from '../src/productsData';
import { CATEGORIES, INITIAL_ORDERS, DEFAULT_LOGISTICS_PROVIDERS } from '../src/data';
import { INITIAL_ADMIN_USERS, INITIAL_ADMIN_VENDORS } from '../src/components/AdminMockData';

function reset() {
  db.exec(`
    DELETE FROM order_items;
    DELETE FROM orders;
    DELETE FROM support_messages;
    DELETE FROM support_chats;
    DELETE FROM products;
    DELETE FROM categories;
    DELETE FROM vendors;
    DELETE FROM users;
    DELETE FROM admins;
    DELETE FROM delivery_zones;
    DELETE FROM logistics_providers;
  `);
}

function seedCategories() {
  const insert = db.prepare(
    'INSERT INTO categories (id, name, icon_name, color, display_order) VALUES (?, ?, ?, ?, ?)'
  );
  // Suremart's original three grocery categories, folded in alongside TradeEase's.
  const suremartCategories = [
    { id: 'frozen-goods', name: 'Frozen Goods', iconName: 'Snowflake', color: 'bg-cyan-100 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400' },
    { id: 'foodstuff', name: 'Foodstuff', iconName: 'Wheat', color: 'bg-lime-100 dark:bg-lime-950/40 text-lime-600 dark:text-lime-400' },
    { id: 'provisions', name: 'Provisions', iconName: 'ShoppingBasket', color: 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-600 dark:text-yellow-400' },
  ];
  let order = 0;
  for (const c of [...CATEGORIES, ...suremartCategories]) {
    insert.run(c.id, c.name, c.iconName, c.color, order++);
  }
}

function seedVendorsAndAdmins() {
  // Real admin login: admin@tradeease.ng / admin123 (change after first login)
  db.prepare('INSERT INTO admins (id, name, email, password_hash, level, phone) VALUES (?, ?, ?, ?, ?, ?)').run(
    randomUUID(),
    'Chief Architect',
    'admin@tradeease.ng',
    hashPassword('admin123'),
    'Superuser Level-4',
    '+234 1 0000 8888'
  );

  const insertVendor = db.prepare(
    'INSERT INTO vendors (id, user_id, name, email, phone, status, store_category, rating, joining_date) VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?)'
  );
  for (const v of INITIAL_ADMIN_VENDORS as any[]) {
    insertVendor.run(v.id, v.name, v.email, v.phone, v.status, v.storeCategory, v.rating, v.joiningDate);
  }
  // Migrated Suremart storefront
  insertVendor.run('vendor-suremart', 'Suremart Grocery', 'store@suremart.ng', '+234 803 000 1111', 'Approved', 'Food & Groceries', 4.6, '2026-04-24');
}

function seedUsers() {
  const insertUser = db.prepare(
    `INSERT INTO users (id, name, email, phone, password_hash, role, avatar, status, total_orders, total_spent, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const u of INITIAL_ADMIN_USERS as any[]) {
    insertUser.run(
      u.id,
      u.name,
      u.email.toLowerCase(),
      u.phone,
      hashPassword('changeme123'), // placeholder; these are demo/imported accounts
      u.role === 'vendor' ? 'vendor' : 'buyer',
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}`,
      u.status,
      u.totalOrders,
      u.totalSpent,
      u.dateJoined
    );
  }
  // A demo account matching Suremart's original seeded customer, so the
  // migrated grocery data has a real owner to log in as: onyekachi@mail.com / password123
  insertUser.run(
    'user-onyekachi',
    'Onyekachi',
    'onyekachi@mail.com',
    '08089426241',
    hashPassword('password123'),
    'buyer',
    'https://api.dicebear.com/7.x/initials/svg?seed=Onyekachi',
    'Active',
    0,
    0,
    new Date().toISOString()
  );
}

function seedProducts() {
  const insert = db.prepare(
    `INSERT INTO products
      (id, title, price, original_price, image, rating, reviews_count, category, description, vendor_name, vendor_id, is_featured, stock)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const p of ALL_PRODUCTS) {
    insert.run(
      p.id,
      p.title,
      p.price,
      p.originalPrice,
      p.image,
      p.rating,
      p.reviewsCount,
      p.category,
      p.description,
      p.vendorName,
      p.vendorId,
      p.isFeatured ? 1 : 0,
      p.stock
    );
  }

  // Suremart's catalog, migrated from mart.sql (products x product_variants,
  // flattened into individual TradeEase products since TradeEase has no
  // variant concept). Original stock_qty values were 0 test data; seeded
  // here with usable demo stock instead.
  const suremartCatalog: Array<{ id: string; title: string; price: number; category: string; image: string; stock: number }> = [
    { id: 'suremart-chicken-big', title: 'Chicken (Big)', price: 5000, category: 'frozen-goods', image: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&q=80&w=600', stock: 25 },
    { id: 'suremart-fish-big-panla', title: 'Fish - Big Panla', price: 2000, category: 'frozen-goods', image: 'https://images.unsplash.com/photo-1544943910-4c1dc44aab44?auto=format&fit=crop&q=80&w=600', stock: 30 },
    { id: 'suremart-fish-small-panla', title: 'Fish - Small Panla', price: 1500, category: 'frozen-goods', image: 'https://images.unsplash.com/photo-1544943910-4c1dc44aab44?auto=format&fit=crop&q=80&w=600', stock: 40 },
    { id: 'suremart-rice-1bag', title: 'Local Rice (1 Bag)', price: 55000, category: 'foodstuff', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=600', stock: 15 },
  ];
  for (const p of suremartCatalog) {
    insert.run(p.id, p.title, p.price, p.price, p.image, 4.5, 0, p.category, p.title, 'Suremart Grocery', 'vendor-suremart', 0, p.stock);
  }
}

function seedOrders() {
  const insertOrder = db.prepare(
    `INSERT INTO orders (id, buyer_id, buyer_name, buyer_phone, city, state, address, total_amount, status, date, shipping_method, shipping_cost, logistics_provider_id, logistics_provider_name, tracking_number, carrier_status, deliveri_tracking_number, deliveri_status)
     VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertItem = db.prepare(
    'INSERT INTO order_items (order_id, product_id, product_title, price, quantity, image) VALUES (?, ?, ?, ?, ?, ?)'
  );
  for (const o of INITIAL_ORDERS as any[]) {
    insertOrder.run(
      o.id,
      o.buyerName,
      o.buyerPhone,
      o.city,
      o.state,
      o.address,
      o.totalAmount,
      o.status,
      o.date,
      o.shippingMethod || null,
      o.shippingCost || 0,
      o.logisticsProviderId || null,
      o.logisticsProviderName || null,
      o.trackingNumber || null,
      o.carrierStatus || null,
      o.deliveriTrackingNumber || null,
      o.deliveriStatus || null
    );
    for (const item of o.items) {
      insertItem.run(o.id, item.productId, item.productTitle, item.price, item.quantity, item.image);
    }
  }
}

function seedLogisticsProviders() {
  const insert = db.prepare(
    `INSERT INTO logistics_providers
      (id, name, code, type, status, api_endpoint, api_key, webhook_url, webhook_secret, base_fee, per_km_rate, estimated_days, badge, description, rating, supported_services, tracking_url_template)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const p of DEFAULT_LOGISTICS_PROVIDERS as any[]) {
    insert.run(
      p.id, p.name, p.code, p.type, p.status, p.apiEndpoint, p.apiKey, p.webhookUrl, p.webhookSecret,
      p.baseFee, p.perKmRate, p.estimatedDays, p.badge, p.description, p.rating,
      JSON.stringify(p.supportedServices || []), p.trackingUrlTemplate
    );
  }
}

function seedDeliveryZones() {
  // Suremart's original flat-fee delivery zones (Port Harcourt area), carried
  // over as a lightweight local-delivery option alongside the logistics providers.
  const zones: Array<[string, number, number]> = [
    ['GRA Phase 1', 1500, 0],
    ['GRA Phase 2', 1500, 0],
    ['Trans Amadi', 2000, 0],
    ['Rumuola', 1200, 0],
    ['Rumuokoro', 1800, 0],
    ['Eleme', 2500, 0],
    ['Oyigbo', 2500, 0],
    ['Old GRA', 1500, 0],
    ['New GRA', 1500, 0],
    ['Woji', 1800, 0],
    ['Rukpokwu', 2000, 0],
    ['Store Pickup', 0, 1],
  ];
  const insert = db.prepare('INSERT INTO delivery_zones (zone_name, fee, is_free, is_active) VALUES (?, ?, ?, 1)');
  for (const [name, fee, free] of zones) insert.run(name, fee, free);
}

export function runSeed() {
  console.log('Resetting database...');
  reset();
  console.log('Seeding categories...');
  seedCategories();
  console.log('Seeding admins & vendors...');
  seedVendorsAndAdmins();
  console.log('Seeding users...');
  seedUsers();
  console.log('Seeding products (TradeEase + migrated Suremart catalog)...');
  seedProducts();
  console.log('Seeding orders...');
  seedOrders();
  console.log('Seeding logistics providers...');
  seedLogisticsProviders();
  console.log('Seeding delivery zones (from Suremart)...');
  seedDeliveryZones();
  console.log('Done.\n');
  console.log('Admin login:  admin@tradeease.ng / admin123');
  console.log('Buyer login:  onyekachi@mail.com / password123');
}

// Only run automatically when invoked directly as a script (`npm run seed`),
// not when imported by server.ts's first-boot auto-seed check.
if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  runSeed();
}
