/**
 * TradeEase sample catalogue seeder.
 *
 * Purpose: populate a fresh/reviewer environment with a substantial catalogue
 * without touching real customer orders, wallets, payments, KYC documents or
 * existing marketplace records.
 *
 * This is intentionally opt-in and must NEVER run automatically in production.
 * Run once with:
 *   DEMO_MARKETPLACE_SEED=true npx tsx backend/seedDemoMarketplace.ts
 *
 * The seeded merchants are sample storefront records, not real merchants.
 * No fake reviews, ratings, KYC verification, sales history or payment history
 * are created.
 */
import 'dotenv/config';
import db from './db';
import { hashPassword } from './auth';

if (process.env.DEMO_MARKETPLACE_SEED !== 'true') {
  throw new Error('Sample catalogue seeding is disabled. Set DEMO_MARKETPLACE_SEED=true for the one-time command.');
}

const SAMPLE_PASSWORD = process.env.DEMO_VENDOR_PASSWORD || 'TradeEaseSample2026!';
const SEED_ID = 'tradease-sample-catalogue-v2-120';
if (SAMPLE_PASSWORD.length < 10) throw new Error('DEMO_VENDOR_PASSWORD must be at least 10 characters.');

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
  'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&q=80&w=900',
];

type Product = [title: string, price: number, category: string, subcategory: string, description: string];
type Vendor = { id: string; userId: string; name: string; email: string; phone: string; category: string; products: Product[] };

const p = (title: string, price: number, category: string, subcategory: string, description: string): Product => [title, price, category, subcategory, description];

const vendors: Vendor[] = [
  { id:'sample-vendor-01', userId:'sample-vendor-user-01', name:'Aba Style Collective', email:'sample.vendor01@tradease.ng', phone:'+2348000010001', category:'Fashion & Apparel', products:[
    p('Classic Senator Native Outfit',85000,'fashion-apparel','mens-fashion','Tailored senator-style native outfit for ceremonies, events and smart traditional occasions.'),
    p('Men’s Linen Kaftan Set',62000,'fashion-apparel','mens-fashion','Lightweight two-piece kaftan set for relaxed smart dressing.'),
    p('Ankara Two-Piece Set',45000,'fashion-apparel','womens-fashion','Versatile Ankara two-piece outfit for casual and occasion wear.'),
    p('Women’s Chiffon Blouse',28000,'fashion-apparel','womens-fashion','Smart chiffon blouse suitable for work, outings and semi-formal occasions.'),
    p('Kids’ Ankara Party Outfit',28000,'fashion-apparel','kids-fashion','Colourful children’s Ankara outfit for parties and family celebrations.'),
    p('Men’s Leather Belt',14000,'fashion-apparel','mens-fashion','Classic leather belt with a simple everyday buckle.'),
    p('Women’s Casual Handbag',32000,'fashion-apparel','womens-fashion','Structured everyday handbag with practical interior compartments.'),
    p('Unisex Cotton Polo',18500,'fashion-apparel','mens-fashion','Soft cotton polo shirt suitable for everyday casual wear.'),
    p('Women’s Slip-On Shoes',30000,'fashion-apparel','womens-fashion','Comfortable slip-on shoes designed for everyday errands and outings.'),
    p('Men’s Canvas Sneakers',36000,'fashion-apparel','mens-fashion','Casual canvas sneakers for everyday city wear.')
  ]},
  { id:'sample-vendor-02', userId:'sample-vendor-user-02', name:'TechHub Marketplace', email:'sample.vendor02@tradease.ng', phone:'+2348000010002', category:'Electronics & Gadgets', products:[
    p('Android Smartphone 128GB',185000,'electronics-gadgets','phones-tablets','Modern Android smartphone with 128GB storage and dual-SIM support.'),
    p('Android Smartphone 256GB',245000,'electronics-gadgets','phones-tablets','Higher-storage smartphone for everyday communication and entertainment.'),
    p('10-inch Android Tablet',145000,'electronics-gadgets','phones-tablets','Large-screen Android tablet for reading, streaming and productivity.'),
    p('Wireless Bluetooth Headset',32000,'electronics-gadgets','audio','Over-ear wireless headset with Bluetooth connectivity for everyday audio.'),
    p('Portable Bluetooth Speaker',38000,'electronics-gadgets','audio','Compact rechargeable speaker for indoor and outdoor listening.'),
    p('Smart Fitness Watch',55000,'electronics-gadgets','wearables','Smart wearable with activity tracking and phone notifications.'),
    p('USB-C Fast Charger 33W',18000,'electronics-gadgets','phones-tablets','Compact USB-C charger for compatible phones and tablets.'),
    p('Power Bank 20,000mAh',42000,'electronics-gadgets','phones-tablets','High-capacity rechargeable power bank with USB charging ports.'),
    p('Wireless Keyboard and Mouse',30000,'electronics-gadgets','computers-accessories','Compact wireless keyboard and mouse combination for desk setups.'),
    p('1080p Webcam',35000,'electronics-gadgets','computers-accessories','Full-HD webcam for video calls, online classes and meetings.')
  ]},
  { id:'sample-vendor-03', userId:'sample-vendor-user-03', name:'HomeNest Living', email:'sample.vendor03@tradease.ng', phone:'+2348000010003', category:'Home & Kitchen', products:[
    p('Modern 3-Seater Sofa',320000,'home-kitchen','furniture','Comfortable modern sofa for living rooms, lounges and reception areas.'),
    p('Two-Seater Fabric Sofa',245000,'home-kitchen','furniture','Compact fabric sofa suited to apartments and smaller living spaces.'),
    p('Decorative Wall Mirror',48000,'home-kitchen','home-decor','Decorative mirror for bedrooms, living rooms, salons and offices.'),
    p('Floating Wall Shelf Set',38000,'home-kitchen','home-decor','Set of practical wall shelves for books, décor and small household items.'),
    p('Queen Size Duvet Set',52000,'home-kitchen','bedding','Soft bedding set for a queen-size bed.'),
    p('Memory Foam Pillow Pair',24000,'home-kitchen','bedding','Pair of supportive memory-foam pillows for everyday sleep comfort.'),
    p('Non-Stick Cookware Set',75000,'home-kitchen','cookware','Multi-piece non-stick cookware set for everyday home cooking.'),
    p('Electric Kettle 1.7L',32000,'home-kitchen','kitchen-appliances','Electric kettle for quick preparation of hot water and beverages.'),
    p('Four-Slice Toaster',48000,'home-kitchen','kitchen-appliances','Countertop toaster for quick breakfast preparation.'),
    p('Stainless Steel Dinner Set',62000,'home-kitchen','cookware','Reusable stainless-steel dining set for family meals and entertaining.')
  ]},
  { id:'sample-vendor-04', userId:'sample-vendor-user-04', name:'GlowCare Beauty Store', email:'sample.vendor04@tradease.ng', phone:'+2348000010004', category:'Beauty, Health & Personal Care', products:[
    p('Daily Skincare Starter Kit',42000,'beauty-health-personal-care','skincare','Simple routine set for cleansing, moisturising and everyday skincare.'),
    p('Gentle Facial Cleanser',18000,'beauty-health-personal-care','skincare','Mild facial cleanser for a simple daily cleansing routine.'),
    p('Hydrating Body Lotion',16000,'beauty-health-personal-care','skincare','Moisturising body lotion for everyday personal care.'),
    p('Classic Eau de Parfum',38000,'beauty-health-personal-care','fragrances','Everyday fragrance with a clean, long-lasting scent profile.'),
    p('Citrus Eau de Toilette',30000,'beauty-health-personal-care','fragrances','Fresh citrus fragrance for daytime use.'),
    p('Natural Hair Care Bundle',30000,'beauty-health-personal-care','hair-care','Routine hair-care bundle for cleansing, conditioning and maintenance.'),
    p('Leave-In Conditioner',15000,'beauty-health-personal-care','hair-care','Lightweight leave-in conditioner for everyday hair maintenance.'),
    p('Makeup Brush Set',22000,'beauty-health-personal-care','makeup','Practical brush set for everyday makeup application.'),
    p('Compact Makeup Organizer',26000,'beauty-health-personal-care','makeup','Small organiser for storing cosmetics and beauty accessories.'),
    p('Personal Grooming Kit',28000,'beauty-health-personal-care','personal-care','Everyday grooming accessory set for home use and travel.')
  ]},
  { id:'sample-vendor-05', userId:'sample-vendor-user-05', name:'FreshBasket Foods', email:'sample.vendor05@tradease.ng', phone:'+2348000010005', category:'Grocery & Food', products:[
    p('Premium Long-Grain Rice 10kg',28500,'grocery-food','packaged-foods','Packaged long-grain rice for family meals and everyday cooking.'),
    p('Parboiled Rice 5kg',15500,'grocery-food','packaged-foods','Convenient 5kg rice pack for household cooking.'),
    p('Cooking Oil 5L',24000,'grocery-food','packaged-foods','Cooking oil in a practical household-size container.'),
    p('Fresh Fruit Basket',18000,'grocery-food','fresh-produce','Assorted seasonal fruits packed for homes and offices.'),
    p('Fresh Vegetable Basket',14000,'grocery-food','fresh-produce','Assorted fresh vegetables for household meal preparation.'),
    p('Family Snack Box',12500,'grocery-food','snacks','Assorted snack box suitable for homes, offices and small events.'),
    p('Breakfast Cereal Pack',9500,'grocery-food','packaged-foods','Breakfast cereal for convenient family meals.'),
    p('Bottled Water 12-Pack',4500,'grocery-food','drinks','Pack of bottled drinking water for home, office or events.'),
    p('Fruit Juice Variety Pack',12000,'grocery-food','drinks','Assorted fruit juice pack for family refreshment.'),
    p('Tea and Beverage Starter Pack',13500,'grocery-food','drinks','Selection of tea and beverage essentials for home or office use.')
  ]},
  { id:'sample-vendor-06', userId:'sample-vendor-user-06', name:'AutoPro Parts', email:'sample.vendor06@tradease.ng', phone:'+2348000010006', category:'Automotive', products:[
    p('Universal Car Phone Holder',12000,'automotive','car-accessories','Dashboard and windscreen phone holder for everyday driving.'),
    p('Car Seat Cover Set',65000,'automotive','car-accessories','Protective seat-cover set for common passenger vehicles.'),
    p('LED Headlight Bulb Pair',28000,'automotive','car-accessories','Replacement LED headlight bulbs for compatible vehicles.'),
    p('Premium Engine Oil 4L',38000,'automotive','oils','Engine oil for routine vehicle maintenance; check vehicle specification before use.'),
    p('Automatic Transmission Fluid 1L',12000,'automotive','oils','Transmission fluid for compatible automatic transmission systems.'),
    p('Automotive Tool Kit',65000,'automotive','automotive-tools','Hand-tool set for routine vehicle maintenance and minor repairs.'),
    p('Tyre Pressure Gauge',9500,'automotive','tools','Compact pressure gauge for routine tyre checks.'),
    p('Microfibre Car Cleaning Set',15000,'automotive','car-accessories','Reusable microfibre cloth set for vehicle cleaning.'),
    p('Car Emergency Triangle Set',11000,'automotive','tools','Reflective roadside warning accessories for vehicle emergencies.'),
    p('12V Car Vacuum Cleaner',32000,'automotive','car-accessories','Compact 12V vacuum for routine interior cleaning.')
  ]},
  { id:'sample-vendor-07', userId:'sample-vendor-user-07', name:'LittleSteps Kids', email:'sample.vendor07@tradease.ng', phone:'+2348000010007', category:'Baby & Kids', products:[
    p('Baby Care Essentials Pack',26000,'baby-kids','baby-care','Convenient baby-care starter pack for everyday household needs.'),
    p('Baby Bath Towel Set',18000,'baby-kids','baby-care','Soft towel set for everyday baby bath routines.'),
    p('Feeding Bowl and Spoon Set',12000,'baby-kids','baby-care','Simple reusable feeding set for young children.'),
    p('Educational Building Blocks',22000,'baby-kids','toys','Colourful building blocks for creative play and basic construction skills.'),
    p('Wooden Shape Puzzle',16000,'baby-kids','toys','Simple shape puzzle designed for supervised learning and play.'),
    p('Kids’ Drawing Set',14500,'baby-kids','school-supplies','Children’s drawing materials for schoolwork and creative activities.'),
    p('School Starter Supplies',18500,'baby-kids','school-supplies','Practical school-supplies bundle for a new school term.'),
    p('Children’s Water Bottle',9500,'baby-kids','school-supplies','Reusable water bottle for school and everyday outings.'),
    p('Kids’ Backpack',24000,'baby-kids','school-supplies','Everyday school backpack with multiple storage compartments.'),
    p('Soft Play Ball Set',13000,'baby-kids','toys','Lightweight play balls for supervised indoor or outdoor activities.')
  ]},
  { id:'sample-vendor-08', userId:'sample-vendor-user-08', name:'FitLife Sports Store', email:'sample.vendor08@tradease.ng', phone:'+2348000010008', category:'Sports & Fitness', products:[
    p('Adjustable Dumbbell Set',70000,'sports-fitness','gym-equipment','Adjustable dumbbell set for home and gym strength workouts.'),
    p('Yoga Mat',18000,'sports-fitness','gym-equipment','Non-slip exercise mat for stretching, yoga and floor workouts.'),
    p('Resistance Band Set',22000,'sports-fitness','gym-equipment','Set of resistance bands for varied home exercise routines.'),
    p('Performance Sports T-Shirt',18000,'sports-fitness','sportswear','Lightweight sportswear top for training and recreational activities.'),
    p('Running Shorts',16000,'sports-fitness','sportswear','Lightweight shorts for running, walking and general training.'),
    p('Training Socks 3-Pack',9000,'sports-fitness','sportswear','Three-pair pack of comfortable training socks.'),
    p('Outdoor Camping Backpack',42000,'sports-fitness','outdoor-gear','Durable backpack for travel, hiking and day trips.'),
    p('Insulated Sports Bottle',16000,'sports-fitness','outdoor-gear','Reusable insulated bottle for sports and outdoor activities.'),
    p('Skipping Rope',8500,'sports-fitness','gym-equipment','Adjustable skipping rope for cardio exercise.'),
    p('Football Training Cones',12000,'sports-fitness','outdoor-gear','Set of training cones for drills and recreational practice.')
  ]},
  { id:'sample-vendor-09', userId:'sample-vendor-user-09', name:'OfficePro Supplies', email:'sample.vendor09@tradease.ng', phone:'+2348000010009', category:'Office & Stationery', products:[
    p('Ergonomic Office Chair',145000,'office-stationery','office-furniture','Comfortable office chair designed for desk work and study.'),
    p('Compact Study Desk',98000,'office-stationery','office-furniture','Simple desk suitable for home offices and study spaces.'),
    p('A4 Copy Paper 500 Sheets',9500,'office-stationery','paper','Standard A4 copy paper for offices, schools and home printing.'),
    p('A4 Notebook 200 Pages',6500,'office-stationery','paper','Ruled notebook for notes, schoolwork and office use.'),
    p('Wireless Office Printer',135000,'office-stationery','printers','Compact wireless printer for everyday document printing.'),
    p('Printer Ink Multipack',28000,'office-stationery','printers','Replacement ink multipack for compatible printers.'),
    p('Desktop File Organizer',12000,'office-stationery','office-accessories','Desktop organiser for documents and stationery.'),
    p('Executive Ballpoint Set',8500,'office-stationery','office-accessories','Set of smooth-writing ballpoint pens for office and school use.'),
    p('Whiteboard 90cm x 60cm',32000,'office-stationery','office-accessories','Wall-mounted whiteboard for classrooms, meetings and home offices.'),
    p('Laptop Stand',18000,'office-stationery','office-accessories','Adjustable stand for raising a laptop to a comfortable working height.')
  ]},
  { id:'sample-vendor-10', userId:'sample-vendor-user-10', name:'GreenField Agro Mart', email:'sample.vendor10@tradease.ng', phone:'+2348000010010', category:'Agriculture & Farm', products:[
    p('Hybrid Vegetable Seeds Pack',8500,'agriculture-farm','seeds','Selected vegetable seeds for small farms, gardens and home growers.'),
    p('Maize Seeds Pack',9000,'agriculture-farm','seeds','Packaged maize seed for suitable farm applications.'),
    p('NPK Fertiliser 25kg',32000,'agriculture-farm','fertilisers','General-purpose fertiliser for farm and garden nutrient management.'),
    p('Organic Compost 20kg',15000,'agriculture-farm','fertilisers','Packaged compost for gardens and suitable crop applications.'),
    p('Farm Hand Tool Set',28000,'agriculture-farm','farm-tools','Basic hand tools for routine cultivation and garden work.'),
    p('Garden Pruning Shears',12000,'agriculture-farm','farm-tools','Hand pruners for suitable garden maintenance tasks.'),
    p('Watering Can 10L',11000,'agriculture-farm','farm-tools','Durable watering can for garden and small-farm use.'),
    p('Seedling Nursery Trays',8500,'agriculture-farm','farm-tools','Reusable trays for starting seedlings under suitable growing conditions.'),
    p('Protective Farm Gloves',7500,'agriculture-farm','farm-tools','Reusable work gloves for routine gardening and farm tasks.'),
    p('Manual Backpack Sprayer 16L',36000,'agriculture-farm','farm-tools','Manual sprayer for compatible agricultural and garden applications; follow product instructions.')
  ]},
  { id:'sample-vendor-11', userId:'sample-vendor-user-11', name:'BuildRight Tools & Hardware', email:'sample.vendor11@tradease.ng', phone:'+2348000010011', category:'Industrial & Tools', products:[
    p('Cordless Drill Driver',78000,'industrial-tools','power-tools','Cordless drill driver for suitable household and workshop tasks.'),
    p('Angle Grinder 4-inch',62000,'industrial-tools','power-tools','Compact angle grinder for compatible cutting and grinding tasks.'),
    p('Measuring Tape 5m',6500,'industrial-tools','hand-tools','Durable five-metre measuring tape for home and workshop use.'),
    p('Claw Hammer',9500,'industrial-tools','hand-tools','General-purpose claw hammer for suitable repair and workshop tasks.'),
    p('Adjustable Wrench Set',16000,'industrial-tools','hand-tools','Set of adjustable wrenches for general maintenance.'),
    p('Screwdriver Set',12500,'industrial-tools','hand-tools','Multi-piece screwdriver set for common household and workshop tasks.'),
    p('Extension Cable 10m',18000,'industrial-tools','electrical-tools','Extension cable for compatible household and workshop equipment.'),
    p('LED Work Light',24000,'industrial-tools','electrical-tools','Portable rechargeable work light for suitable work areas.'),
    p('Safety Goggles',6500,'industrial-tools','safety-equipment','Protective eyewear for appropriate workshop tasks.'),
    p('Tool Storage Box',28000,'industrial-tools','hand-tools','Portable storage box for organising small tools and accessories.')
  ]},
  { id:'sample-vendor-12', userId:'sample-vendor-user-12', name:'Everyday Market Essentials', email:'sample.vendor12@tradease.ng', phone:'+2348000010012', category:'Home & Kitchen', products:[
    p('Rechargeable Table Lamp',22000,'home-kitchen','home-essentials','Compact rechargeable lamp for study desks, bedrooms and workspaces.'),
    p('USB Rechargeable Fan',26000,'home-kitchen','home-essentials','Portable rechargeable fan for personal use.'),
    p('Reusable Shopping Bag Set',9000,'home-kitchen','household','Set of reusable shopping bags for everyday errands.'),
    p('Stainless Steel Flask 1L',14500,'home-kitchen','household','Reusable insulated flask for hot or cold drinks.'),
    p('Digital Kitchen Scale',18000,'home-kitchen','kitchen','Compact digital kitchen scale for household food measurement.'),
    p('Storage Container Set',21000,'home-kitchen','household','Stackable household storage containers for food and general organisation.'),
    p('Laundry Basket',15000,'home-kitchen','household','Ventilated household laundry basket with sturdy handles.'),
    p('Multipurpose Cleaning Set',17500,'home-kitchen','household','Basic reusable cleaning tools for routine household cleaning.'),
    p('Travel Organiser Pouch Set',13000,'home-kitchen','travel','Set of pouches for organising small travel items and accessories.'),
    p('Foldable Storage Rack',32000,'home-kitchen','household','Space-saving rack for organising suitable household items.')
  ]}
];

const totalProducts = vendors.reduce((n, v) => n + v.products.length, 0);
if (vendors.length !== 12 || totalProducts < 100) throw new Error(`Catalogue definition error: ${vendors.length} vendors / ${totalProducts} products.`);

const run = db.transaction(() => {
  db.exec(`CREATE TABLE IF NOT EXISTS demo_seed_runs (seed_id TEXT PRIMARY KEY, seeded_at TEXT NOT NULL DEFAULT (datetime('now')))`);
  if (db.prepare('SELECT seed_id FROM demo_seed_runs WHERE seed_id=?').get(SEED_ID)) {
    console.log(`[sample-catalogue] ${SEED_ID} has already been applied. Nothing to do.`);
    return false;
  }

  const passwordHash = hashPassword(SAMPLE_PASSWORD);
  const upsertUser = db.prepare(`
    INSERT INTO users (id,name,email,phone,password_hash,role,avatar,status,auth_provider,email_verified,created_at)
    VALUES (?,?,?,?,?,'vendor',?,'Active','local',1,datetime('now'))
    ON CONFLICT(id) DO UPDATE SET name=excluded.name,email=excluded.email,phone=excluded.phone,password_hash=excluded.password_hash,role='vendor',avatar=excluded.avatar,status='Active',auth_provider='local',email_verified=1
  `);
  const upsertVendor = db.prepare(`
    INSERT INTO vendors (id,user_id,name,email,phone,status,store_category,rating,joining_date,kyc_status,logo,account_status,store_status,payout_status)
    VALUES (?,?,?,?,?,'Pending',?,0,date('now'),'Unverified',?, 'Active','Active','On Hold')
    ON CONFLICT(id) DO UPDATE SET user_id=excluded.user_id,name=excluded.name,email=excluded.email,phone=excluded.phone,status='Pending',store_category=excluded.store_category,rating=0,kyc_status='Unverified',logo=excluded.logo,account_status='Active',store_status='Active',payout_status='On Hold'
  `);
  const upsertProduct = db.prepare(`
    INSERT INTO products (id,title,price,original_price,image,rating,reviews_count,category,subcategory,description,vendor_name,vendor_id,is_featured,stock,images,specifications)
    VALUES (?,?,?,?,?,0,0,?,?,?,?,?,?,?, ?,?)
    ON CONFLICT(id) DO UPDATE SET title=excluded.title,price=excluded.price,original_price=excluded.original_price,image=excluded.image,rating=0,reviews_count=0,category=excluded.category,subcategory=excluded.subcategory,description=excluded.description,vendor_name=excluded.vendor_name,vendor_id=excluded.vendor_id,is_featured=excluded.is_featured,stock=excluded.stock,images=excluded.images,specifications=excluded.specifications,updated_at=datetime('now')
  `);

  let i = 0;
  for (const vendor of vendors) {
    const logo = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(vendor.name)}`;
    upsertUser.run(vendor.userId, vendor.name, vendor.email, vendor.phone, passwordHash, logo);
    upsertVendor.run(vendor.id, vendor.userId, vendor.name, vendor.email, vendor.phone, vendor.category, logo);
    vendor.products.forEach(([title, price, category, subcategory, description], index) => {
      const id = `${vendor.id}-product-${String(index + 1).padStart(2,'0')}`;
      const image = imagePool[i % imagePool.length];
      const originalPrice = Math.round(price * 1.1);
      const specifications = JSON.stringify({
        catalogueSource: 'seeded-sample',
        availability: 'Sample catalogue stock',
        seller: vendor.name,
        category: vendor.category
      });
      upsertProduct.run(id,title,price,originalPrice,image,category,subcategory,description,vendor.name,vendor.id,index === 0 ? 1 : 0,10 + ((index * 7) % 41),JSON.stringify([image]),specifications);
      i++;
    });
  }
  db.prepare('INSERT INTO demo_seed_runs(seed_id) VALUES(?)').run(SEED_ID);
  console.log(`[sample-catalogue] Created/updated ${vendors.length} sample storefronts and ${totalProducts} sample products.`);
  return true;
});

run();
console.log('[sample-catalogue] Complete. Existing marketplace data, orders, wallets, payments and KYC documents were not deleted or reset.');
