/**
 * TradeEase production-safe demo marketplace seeder.
 *
 * PURPOSE:
 *   Adds 10 realistic demo vendor accounts and 30 demo products to an
 *   existing TradeEase database without deleting or resetting real data.
 *
 * RUN ON RAILWAY (one time):
 *   DEMO_MARKETPLACE_SEED=true npx tsx backend/seedDemoMarketplace.ts
 *
 * The script is idempotent: re-running it updates the same demo records
 * rather than creating duplicates. It never calls the destructive seed.ts.
 */
import 'dotenv/config';
import db from './db';
import { hashPassword } from './auth';

if (process.env.DEMO_MARKETPLACE_SEED !== 'true') {
  throw new Error(
    'Demo marketplace seeding is disabled. Set DEMO_MARKETPLACE_SEED=true for this one-time command.'
  );
}

const DEMO_PASSWORD = process.env.DEMO_VENDOR_PASSWORD || 'TradeEaseDemo2026!';
const SEED_ID = 'tradease-demo-marketplace-v1';

if (DEMO_PASSWORD.length < 10) {
  throw new Error('DEMO_VENDOR_PASSWORD must be at least 10 characters.');
}

const vendors = [
  { id:'demo-vendor-01', userId:'demo-vendor-user-01', name:'Aba Fashion House', email:'demo.vendor01@tradease.ng', phone:'+2348000001001', category:'Fashion & Apparel', logo:'https://api.dicebear.com/9.x/initials/svg?seed=Aba%20Fashion%20House', products:[
    ['Classic Senator Native Outfit',85000,'fashion-apparel','mens-fashion','Premium senator-style native outfit suitable for weddings, ceremonies and corporate occasions.'],
    ['Women\'s Ankara Two-Piece Set',45000,'fashion-apparel','womens-fashion','Stylish Ankara two-piece outfit with a comfortable fit for everyday and occasion wear.'],
    ['Kids\' Ankara Party Outfit',28000,'fashion-apparel','kids-fashion','Colourful children\'s Ankara outfit designed for parties, family events and celebrations.']
  ]},
  { id:'demo-vendor-02', userId:'demo-vendor-user-02', name:'TechHub Nigeria', email:'demo.vendor02@tradease.ng', phone:'+2348000001002', category:'Electronics & Gadgets', logo:'https://api.dicebear.com/9.x/initials/svg?seed=TechHub%20Nigeria', products:[
    ['Android Smartphone 128GB',185000,'electronics-gadgets','phones-tablets','Modern Android smartphone with 128GB storage, dual SIM support and long-lasting battery.'],
    ['Wireless Bluetooth Headset',32000,'electronics-gadgets','audio','Comfortable wireless headset with Bluetooth connectivity and clear everyday audio.'],
    ['Smart Fitness Watch',55000,'electronics-gadgets','wearables','Smart wearable with activity tracking, notifications and health-focused fitness features.']
  ]},
  { id:'demo-vendor-03', userId:'demo-vendor-user-03', name:'HomeNest Interiors', email:'demo.vendor03@tradease.ng', phone:'+2348000001003', category:'Home & Kitchen', logo:'https://api.dicebear.com/9.x/initials/svg?seed=HomeNest%20Interiors', products:[
    ['Modern 3-Seater Sofa',320000,'home-kitchen','furniture','Comfortable modern sofa designed for living rooms, lounges and reception areas.'],
    ['Decorative Wall Mirror',48000,'home-kitchen','home-decor','Elegant decorative mirror for bedrooms, living rooms, salons and offices.'],
    ['Non-Stick Cookware Set',75000,'home-kitchen','cookware','Practical multi-piece non-stick cookware set for everyday home cooking.']
  ]},
  { id:'demo-vendor-04', userId:'demo-vendor-user-04', name:'GlowCare Beauty Store', email:'demo.vendor04@tradease.ng', phone:'+2348000001004', category:'Beauty, Health & Personal Care', logo:'https://api.dicebear.com/9.x/initials/svg?seed=GlowCare%20Beauty%20Store', products:[
    ['Everyday Skincare Starter Kit',42000,'beauty-health-personal-care','skincare','Simple skincare collection for cleansing, moisturising and everyday personal care.'],
    ['Classic Eau de Parfum',38000,'beauty-health-personal-care','fragrances','Elegant everyday fragrance with a clean, long-lasting scent profile.'],
    ['Natural Hair Care Bundle',30000,'beauty-health-personal-care','hair-care','Hair-care bundle with practical products for routine maintenance and styling.']
  ]},
  { id:'demo-vendor-05', userId:'demo-vendor-user-05', name:'FreshBasket Foods', email:'demo.vendor05@tradease.ng', phone:'+2348000001005', category:'Grocery & Food', logo:'https://api.dicebear.com/9.x/initials/svg?seed=FreshBasket%20Foods', products:[
    ['Premium Long-Grain Rice 10kg',28500,'grocery-food','packaged-foods','Quality packaged long-grain rice for family meals and everyday cooking.'],
    ['Fresh Fruit Basket',18000,'grocery-food','fresh-produce','Assorted fresh seasonal fruits carefully packed for homes and offices.'],
    ['Family Snack Box',12500,'grocery-food','snacks','Assorted snack box suitable for homes, offices, meetings and small events.']
  ]},
  { id:'demo-vendor-06', userId:'demo-vendor-user-06', name:'AutoPro Parts', email:'demo.vendor06@tradease.ng', phone:'+2348000001006', category:'Automotive', logo:'https://api.dicebear.com/9.x/initials/svg?seed=AutoPro%20Parts', products:[
    ['Universal Car Phone Holder',12000,'automotive','car-accessories','Secure dashboard and windscreen phone holder for everyday driving.'],
    ['Premium Engine Oil 4L',38000,'automotive','oils','Quality engine oil suitable for routine vehicle maintenance.'],
    ['Automotive Tool Kit',65000,'automotive','automotive-tools','Practical hand-tool kit for routine vehicle maintenance and minor repairs.']
  ]},
  { id:'demo-vendor-07', userId:'demo-vendor-user-07', name:'LittleSteps Kids', email:'demo.vendor07@tradease.ng', phone:'+2348000001007', category:'Baby & Kids', logo:'https://api.dicebear.com/9.x/initials/svg?seed=LittleSteps%20Kids', products:[
    ['Baby Care Essentials Pack',26000,'baby-kids','baby-care','Convenient baby-care starter pack for everyday household needs.'],
    ['Educational Building Blocks',22000,'baby-kids','toys','Colourful building blocks that encourage creative play and basic construction skills.'],
    ['School Starter Supplies',18500,'baby-kids','school-supplies','Practical school-supplies bundle for pupils preparing for a new term.']
  ]},
  { id:'demo-vendor-08', userId:'demo-vendor-user-08', name:'FitLife Sports Store', email:'demo.vendor08@tradease.ng', phone:'+2348000001008', category:'Sports & Fitness', logo:'https://api.dicebear.com/9.x/initials/svg?seed=FitLife%20Sports%20Store', products:[
    ['Adjustable Dumbbell Set',70000,'sports-fitness','gym-equipment','Adjustable dumbbell set for practical home and gym strength workouts.'],
    ['Performance Sports T-Shirt',18000,'sports-fitness','sportswear','Lightweight sportswear top suitable for training, walking and recreational activities.'],
    ['Outdoor Camping Backpack',42000,'sports-fitness','outdoor-gear','Durable outdoor backpack with useful storage for travel, hiking and day trips.']
  ]},
  { id:'demo-vendor-09', userId:'demo-vendor-user-09', name:'OfficePro Supplies', email:'demo.vendor09@tradease.ng', phone:'+2348000001009', category:'Office & Stationery', logo:'https://api.dicebear.com/9.x/initials/svg?seed=OfficePro%20Supplies', products:[
    ['Ergonomic Office Chair',145000,'office-stationery','office-furniture','Comfortable office chair designed for extended desk work and study sessions.'],
    ['A4 Copy Paper 500 Sheets',9500,'office-stationery','paper','Standard A4 copy paper for offices, schools, businesses and home printing.'],
    ['Wireless Office Printer',135000,'office-stationery','printers','Compact wireless printer suitable for everyday home and small-office document printing.']
  ]},
  { id:'demo-vendor-10', userId:'demo-vendor-user-10', name:'GreenField Agro Mart', email:'demo.vendor10@tradease.ng', phone:'+2348000001010', category:'Agriculture & Farm', logo:'https://api.dicebear.com/9.x/initials/svg?seed=GreenField%20Agro%20Mart', products:[
    ['Hybrid Vegetable Seeds Pack',8500,'agriculture-farm','seeds','Selected vegetable seeds for small farms, gardens and home growers.'],
    ['NPK Fertiliser 25kg',32000,'agriculture-farm','fertilisers','General-purpose fertiliser for farm and garden nutrient management.'],
    ['Farm Hand Tool Set',28000,'agriculture-farm','farm-tools','Practical set of basic farm hand tools for routine cultivation and garden work.']
  ]}
];

const imagePool = [
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=900',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=900',
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=900',
  'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=900',
  'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=900',
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=900',
  'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=900',
  'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&q=80&w=900',
  'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&q=80&w=900',
  'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&q=80&w=900'
];

const run = db.transaction(() => {
  db.exec(`CREATE TABLE IF NOT EXISTS demo_seed_runs (
    seed_id TEXT PRIMARY KEY,
    seeded_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  const already = db.prepare('SELECT seed_id FROM demo_seed_runs WHERE seed_id=?').get(SEED_ID);
  if (already) {
    console.log(`[demo-seed] ${SEED_ID} has already been applied. Nothing to do.`);
    return false;
  }

  const upsertUser = db.prepare(`
    INSERT INTO users (id,name,email,phone,password_hash,role,avatar,status,auth_provider,email_verified,created_at)
    VALUES (?,?,?,?,?,'vendor',?,'Active','local',1,datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name,email=excluded.email,phone=excluded.phone,
      password_hash=excluded.password_hash,role='vendor',avatar=excluded.avatar,
      status='Active',auth_provider='local',email_verified=1
  `);

  const upsertVendor = db.prepare(`
    INSERT INTO vendors (id,user_id,name,email,phone,status,store_category,rating,joining_date,kyc_status,logo,account_status,store_status,payout_status)
    VALUES (?,?,?,?,?,'Approved',?,4.7,date('now'),'Verified',?,'Active','Active','Active')
    ON CONFLICT(id) DO UPDATE SET
      user_id=excluded.user_id,name=excluded.name,email=excluded.email,phone=excluded.phone,
      status='Approved',store_category=excluded.store_category,rating=excluded.rating,
      kyc_status='Verified',logo=excluded.logo,account_status='Active',store_status='Active',payout_status='Active'
  `);

  const upsertProduct = db.prepare(`
    INSERT INTO products (id,title,price,original_price,image,rating,reviews_count,category,subcategory,description,vendor_name,vendor_id,is_featured,stock,images,specifications)
    VALUES (?,?,?,?,?,?,?, ?,?,?,?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET
      title=excluded.title,price=excluded.price,original_price=excluded.original_price,image=excluded.image,
      rating=excluded.rating,reviews_count=excluded.reviews_count,category=excluded.category,
      subcategory=excluded.subcategory,description=excluded.description,vendor_name=excluded.vendor_name,
      vendor_id=excluded.vendor_id,is_featured=excluded.is_featured,stock=excluded.stock,
      images=excluded.images,specifications=excluded.specifications,updated_at=datetime('now')
  `);

  let productIndex = 0;
  for (const vendor of vendors) {
    const passwordHash = hashPassword(DEMO_PASSWORD);
    upsertUser.run(vendor.userId, vendor.name, vendor.email, vendor.phone, passwordHash, vendor.logo);
    upsertVendor.run(vendor.id, vendor.userId, vendor.name, vendor.email, vendor.phone, vendor.category, vendor.logo);

    vendor.products.forEach((p, index) => {
      const [title, price, category, subcategory, description] = p as [string, number, string, string, string];
      const id = `${vendor.id}-product-${index + 1}`;
      const image = imagePool[productIndex % imagePool.length];
      const originalPrice = Math.round(price * 1.12);
      const specifications = JSON.stringify({
        'Demo listing': 'Yes',
        'Availability': 'In stock',
        'Seller': vendor.name,
        'Category': vendor.category
      });
      upsertProduct.run(
        id,title,price,originalPrice,image,4.6 + ((index % 3) * 0.1),
        8 + index,category,subcategory,description,vendor.name,vendor.id,
        index === 0 ? 1 : 0,30 + (index * 10),JSON.stringify([image]),specifications
      );
      productIndex++;
    });
  }

  db.prepare('INSERT INTO demo_seed_runs(seed_id) VALUES(?)').run(SEED_ID);
  console.log(`[demo-seed] Created/updated ${vendors.length} vendors and ${vendors.reduce((n,v)=>n+v.products.length,0)} products.`);
  console.log(`[demo-seed] Demo vendor password: ${DEMO_PASSWORD}`);
  return true;
});

run();
console.log('[demo-seed] Complete. Existing marketplace data was not deleted or reset.');
