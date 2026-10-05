/**
 * TradeEase starter catalogue seeder.
 *
 * Adds a substantial initial marketplace catalogue to an existing database.
 * It is additive and idempotent: it never resets users, orders, wallets or
 * existing products. Synthetic storefront records are intentionally not
 * marked KYC-verified and no fabricated review counts are created.
 *
 * One-time Railway use:
 *   STARTER_CATALOG_SEED=true npm run seed:catalog
 *
 * Or enable STARTER_CATALOG_SEED=true for one deployment; the server will
 * apply the catalogue once at startup and record the seed as completed.
 */
import 'dotenv/config';
import db from './db';
import { TRADEASE_CATALOG } from '../src/catalogTaxonomy';

if (process.env.STARTER_CATALOG_SEED !== 'true') {
  throw new Error('Starter catalogue seeding is disabled. Set STARTER_CATALOG_SEED=true for the one-time catalogue import.');
}

const SEED_ID = 'tradease-starter-catalog-v2-120';

type ProductDef = { title: string; price: number; subcategory: string; description: string; image: string };
type ProductInput = ProductDef | [string, number, string, string, string];

type VendorDef = {
  id: string;
  name: string;
  email: string;
  phone: string;
  category: string;
  logo: string;
  products: ProductInput[];
};

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&q=82&w=900`;

const images = {
  phone: img('photo-1511707171634-5f897ff02aa9'),
  laptop: img('photo-1496181133206-80ce9b88a853'),
  watch: img('photo-1523275335684-37898b6baf30'),
  audio: img('photo-1505740420928-5e560c06d30e'),
  fashion: img('photo-1529139574466-a303027c1d8b'),
  shoe: img('photo-1542291026-7eec264c27ff'),
  furniture: img('photo-1555041469-a586c61ea9bc'),
  kitchen: img('photo-1556911220-e15b29be8c8f'),
  beauty: img('photo-1596462502278-27bfdc403348'),
  food: img('photo-1542838132-92c53300491e'),
  car: img('photo-1503376780353-7e6692767b70'),
  baby: img('photo-1596461404969-9ae70f2830c1'),
  fitness: img('photo-1579758629938-03607ccdbaba'),
  office: img('photo-1497366811353-6870744d04b2'),
  tools: img('photo-1530124566582-a618bc2615dc'),
  books: img('photo-1544947950-fa07a98d237f'),
  farm: img('photo-1464226184884-fa280b87c399'),
  craft: img('photo-1452860606245-08befc0ff44b'),
  perfume: img('photo-1541643600914-78b084683601'),
};

const vendors: VendorDef[] = [
  {
    id:'catalog-vendor-01', name:'UrbanThread NG', email:'store01@tradease.ng', phone:'+2348100001001', category:'Fashion & Apparel', logo:images.fashion,
    products:[
      ['Classic Cotton Senator Set',68000,'mens-fashion','Tailored native two-piece made from breathable cotton fabric for smart casual and occasion dressing.',images.fashion],
      ['Premium Linen Kaftan',72000,'mens-fashion','Relaxed-fit linen kaftan with a clean finish for weddings, Friday wear and social occasions.',images.fashion],
      ['Men’s Leather Loafers',52000,'mens-fashion','Polished leather loafers designed for office wear, ceremonies and smart casual outfits.',images.shoe],
      ['Ankara Midi Dress',46000,'womens-fashion','Colourful Ankara midi dress with a versatile silhouette for work, events and weekend outings.',images.fashion],
      ['Women’s Satin Blouse',32000,'womens-fashion','Smooth satin blouse with a refined finish that pairs easily with trousers or skirts.',images.fashion],
      ['Women’s Everyday Handbag',58000,'womens-fashion','Structured everyday handbag with room for essentials and a practical interior.',images.fashion],
      ['Girls’ Occasion Dress',28500,'kids-fashion','Comfortable occasion dress for birthdays, family celebrations and school events.',images.fashion],
      ['Boys’ Traditional Outfit',30000,'kids-fashion','Smart traditional outfit for children’s celebrations and family occasions.',images.fashion],
      ['Unisex Canvas Sneakers',39000,'mens-fashion','Everyday canvas sneakers with a flexible sole for casual city wear.',images.shoe],
      ['Classic Leather Belt',18000,'mens-fashion','Simple full-grain leather belt with a durable buckle for everyday use.',images.fashion],
    ].map(([title,price,subcategory,description,image]: [string,number,string,string,string]): ProductDef => ({title,price,subcategory,description,image})),
  },
  {
    id:'catalog-vendor-02', name:'GadgetBay Nigeria', email:'store02@tradease.ng', phone:'+2348100001002', category:'Electronics & Gadgets', logo:images.phone,
    products:[
      ['Android Smartphone 128GB',185000,'phones-tablets','Modern dual-SIM smartphone with 128GB storage, bright display and dependable battery life.',images.phone],
      ['5G Android Smartphone 256GB',265000,'phones-tablets','5G-ready smartphone with generous storage for apps, photos and everyday entertainment.',images.phone],
      ['10-inch Android Tablet',145000,'phones-tablets','Portable tablet for reading, streaming, schoolwork and everyday browsing.',images.phone],
      ['14-inch Business Laptop',385000,'computers-accessories','Slim laptop suitable for office work, study, browsing and productivity applications.',images.laptop],
      ['Wireless Keyboard and Mouse',28500,'computers-accessories','Compact wireless keyboard and mouse combination for desks, home offices and study spaces.',images.laptop],
      ['1080p Smart TV 43-inch',295000,'tvs','Full HD smart television with streaming-ready connectivity and multiple input ports.',images.audio],
      ['Portable Bluetooth Speaker',48000,'audio','Compact wireless speaker designed for clear everyday music playback at home or outdoors.',images.audio],
      ['Noise-Reducing Wireless Headphones',62000,'audio','Comfortable wireless headphones for commuting, study sessions and entertainment.',images.audio],
      ['Smart Fitness Watch',55000,'wearables','Smart wearable with activity tracking, notifications and practical daily fitness features.',images.watch],
      ['Fast-Charging Power Bank 20000mAh',36000,'phones-tablets','High-capacity power bank with multiple outputs for phones and small devices.',images.phone],
    ],
  },
  {
    id:'catalog-vendor-03', name:'HomeNest Living', email:'store03@tradease.ng', phone:'+2348100001003', category:'Home & Kitchen', logo:images.furniture,
    products:[
      ['Modern 3-Seater Sofa',320000,'furniture','Comfortable modern sofa designed for living rooms, lounges and reception areas.',images.furniture],
      ['Two-Seater Accent Sofa',245000,'furniture','Compact upholstered sofa for apartments, bedrooms, offices and reception spaces.',images.furniture],
      ['Wooden Centre Table',98000,'furniture','Solid-looking centre table with a clean contemporary profile for modern interiors.',images.furniture],
      ['Decorative Wall Mirror',48000,'home-decor','Large decorative mirror suited to bedrooms, living rooms, salons and offices.',images.furniture],
      ['Minimalist Table Lamp',29500,'home-decor','Warm decorative table lamp for bedside tables, workspaces and reading corners.',images.furniture],
      ['Queen Size Bedsheet Set',42000,'bedding','Soft queen-size bedding set with matching pillow covers for everyday home use.',images.furniture],
      ['Electric Blender 1.5L',62000,'kitchen-appliances','Multi-purpose countertop blender for smoothies, sauces and everyday kitchen preparation.',images.kitchen],
      ['4-Burner Gas Cooker',210000,'kitchen-appliances','Four-burner cooker designed for everyday family meal preparation.',images.kitchen],
      ['Non-Stick Cookware Set',75000,'cookware','Practical multi-piece non-stick cookware set for everyday home cooking.',images.kitchen],
      ['Stainless Steel Kitchen Rack',55000,'home-decor','Space-saving rack for organising cookware, utensils and pantry essentials.',images.kitchen],
    ],
  },
  {
    id:'catalog-vendor-04', name:'GlowCare Beauty', email:'store04@tradease.ng', phone:'+2348100001004', category:'Beauty, Health & Personal Care', logo:images.beauty,
    products:[
      ['Daily Skincare Starter Kit',42000,'skincare','Simple daily skincare collection covering cleansing, moisturising and routine care.',images.beauty],
      ['Hydrating Face Moisturiser',18500,'skincare','Lightweight moisturiser formulated for a comfortable everyday skincare routine.',images.beauty],
      ['Gentle Facial Cleanser',16000,'skincare','Mild facial cleanser for removing everyday dirt and excess oil without a heavy feel.',images.beauty],
      ['Neutral Everyday Makeup Kit',38000,'makeup','Practical makeup selection for simple everyday looks and special occasions.',images.beauty],
      ['Natural Hair Care Bundle',30000,'hair-care','Hair-care bundle for routine cleansing, conditioning and everyday maintenance.',images.beauty],
      ['Leave-In Hair Conditioner',14500,'hair-care','Lightweight leave-in conditioner for routine hair care and easy styling.',images.beauty],
      ['Classic Eau de Parfum',38000,'fragrances','Elegant everyday fragrance with a clean, lasting scent profile.',images.perfume],
      ['Fresh Citrus Fragrance',33000,'fragrances','Bright citrus-forward fragrance suitable for daytime wear and casual occasions.',images.perfume],
      ['Daily Multivitamin Pack',22000,'health-supplements','Convenient daily supplement pack intended to complement a balanced lifestyle.',images.beauty],
      ['Body Care Essentials Set',27000,'skincare','Everyday body-care set for cleansing, moisturising and personal care routines.',images.beauty],
    ],
  },
  {
    id:'catalog-vendor-05', name:'FreshBasket Market', email:'store05@tradease.ng', phone:'+2348100001005', category:'Grocery & Food', logo:images.food,
    products:[
      ['Premium Long-Grain Rice 10kg',28500,'packaged-foods','Quality packaged long-grain rice suitable for family meals and everyday cooking.',images.food],
      ['Parboiled Rice 5kg',15500,'packaged-foods','Convenient family-size pack of parboiled rice for everyday meals.',images.food],
      ['Breakfast Cereal Family Pack',9800,'packaged-foods','Family-size breakfast cereal for convenient weekday mornings.',images.food],
      ['Fresh Seasonal Fruit Basket',18000,'fresh-produce','Assorted seasonal fruits packed for homes, offices and small gatherings.',images.food],
      ['Fresh Vegetable Basket',12500,'fresh-produce','Assorted vegetables selected for routine home cooking and meal preparation.',images.food],
      ['Natural Fruit Juice 1L',4200,'drinks','Refreshing fruit drink in a convenient family-size bottle.',images.food],
      ['Sparkling Water Pack',6500,'drinks','Multipack of bottled sparkling water for home, office and events.',images.food],
      ['Family Snack Box',12500,'snacks','Assorted snack selection suitable for homes, offices, meetings and small events.',images.food],
      ['Plantain Chips Family Pack',7500,'snacks','Crisp plantain snack in a convenient share-size pack.',images.food],
      ['Breakfast Essentials Bundle',23500,'packaged-foods','Practical combination of breakfast staples for a busy household.',images.food],
    ],
  },
  {
    id:'catalog-vendor-06', name:'AutoPro Parts', email:'store06@tradease.ng', phone:'+2348100001006', category:'Automotive', logo:images.car,
    products:[
      ['Universal Car Phone Holder',12000,'car-accessories','Secure dashboard and windscreen phone holder for everyday driving.',images.car],
      ['Premium Car Floor Mat Set',68000,'car-accessories','Durable floor mat set designed to protect vehicle interiors from everyday dirt.',images.car],
      ['LED Interior Light Kit',18500,'car-accessories','Compact LED lighting kit for practical vehicle interior illumination.',images.car],
      ['Front Brake Pad Set',52000,'spare-parts','Replacement brake pad set for routine vehicle maintenance; confirm fitment before purchase.',images.car],
      ['12V Car Battery',145000,'spare-parts','12-volt automotive battery for compatible passenger vehicles.',images.car],
      ['Premium Engine Oil 4L',38000,'oils','Quality engine oil for routine vehicle servicing and maintenance.',images.car],
      ['Automatic Transmission Fluid 4L',42000,'oils','Transmission fluid for compatible automatic transmission service intervals.',images.car],
      ['Automotive Tool Kit',65000,'automotive-tools','Practical hand-tool kit for routine vehicle maintenance and minor repairs.',images.tools],
      ['Digital Tyre Pressure Gauge',14500,'automotive-tools','Portable digital gauge for convenient tyre pressure checks.',images.car],
      ['Car Cleaning Kit',26000,'car-accessories','Practical collection of brushes, cloths and cleaning accessories for vehicle care.',images.car],
    ],
  },
  {
    id:'catalog-vendor-07', name:'LittleSteps Kids', email:'store07@tradease.ng', phone:'+2348100001007', category:'Baby & Kids', logo:images.baby,
    products:[
      ['Baby Care Essentials Pack',26000,'baby-care','Convenient baby-care starter pack for everyday household needs.',images.baby],
      ['Gentle Baby Bath Set',18500,'baby-care','Everyday bath-time essentials selected for convenient family routines.',images.baby],
      ['Soft Baby Changing Mat',22000,'baby-care','Portable changing mat with a practical wipe-clean surface.',images.baby],
      ['Educational Building Blocks',22000,'toys','Colourful building blocks that encourage creative play and basic construction skills.',images.baby],
      ['Remote-Control Toy Car',28500,'toys','Fun rechargeable toy car for supervised indoor and outdoor play.',images.baby],
      ['Children’s Puzzle Set',12500,'toys','Age-appropriate puzzle set designed for recreational problem-solving and play.',images.baby],
      ['School Starter Supplies',18500,'school-supplies','Practical school-supplies bundle for pupils preparing for a new term.',images.baby],
      ['Children’s Backpack',24500,'school-supplies','Comfortable school backpack with organised compartments for daily essentials.',images.baby],
      ['Reusable Lunch Box Set',15000,'school-supplies','Durable lunch containers suitable for school and family outings.',images.baby],
      ['Kids’ Water Bottle',9500,'school-supplies','Reusable child-friendly bottle for school, sports and outdoor activities.',images.baby],
    ],
  },
  {
    id:'catalog-vendor-08', name:'FitLife Sports Store', email:'store08@tradease.ng', phone:'+2348100001008', category:'Sports & Fitness', logo:images.fitness,
    products:[
      ['Adjustable Dumbbell Set',70000,'gym-equipment','Adjustable dumbbell set for practical home and gym strength workouts.',images.fitness],
      ['Yoga Mat',22000,'gym-equipment','Cushioned exercise mat suitable for stretching, yoga and floor workouts.',images.fitness],
      ['Resistance Band Set',18000,'gym-equipment','Multi-level resistance bands for home workouts, mobility and strength routines.',images.fitness],
      ['Performance Sports T-Shirt',18000,'sportswear','Lightweight sportswear top suitable for training, walking and recreational activities.',images.fitness],
      ['Training Shorts',16000,'sportswear','Comfortable training shorts designed for gym sessions and outdoor exercise.',images.fitness],
      ['Running Sneakers',65000,'sportswear','Cushioned running shoes for recreational jogging and everyday active use.',images.shoe],
      ['Outdoor Camping Backpack',42000,'outdoor-gear','Durable outdoor backpack with useful storage for travel, hiking and day trips.',images.fitness],
      ['Insulated Sports Bottle',14500,'outdoor-gear','Reusable insulated bottle for keeping drinks convenient during activities.',images.fitness],
      ['Compact Camping Lantern',19500,'outdoor-gear','Portable rechargeable lantern for camping, travel and outdoor use.',images.fitness],
      ['Skipping Rope',8500,'gym-equipment','Adjustable skipping rope for cardio workouts at home or outdoors.',images.fitness],
    ],
  },
  {
    id:'catalog-vendor-09', name:'OfficePro Supplies', email:'store09@tradease.ng', phone:'+2348100001009', category:'Office & Stationery', logo:images.office,
    products:[
      ['Ergonomic Office Chair',145000,'office-furniture','Comfortable office chair designed for extended desk work and study sessions.',images.office],
      ['Compact Work Desk',118000,'office-furniture','Practical work desk for home offices, study spaces and small businesses.',images.office],
      ['A4 Copy Paper 500 Sheets',9500,'paper','Standard A4 copy paper for offices, schools, businesses and home printing.',images.office],
      ['A4 Coloured Paper Pack',7200,'paper','Assorted coloured A4 paper for office projects, schoolwork and presentations.',images.office],
      ['Wireless Office Printer',135000,'printers','Compact wireless printer suitable for everyday home and small-office documents.',images.office],
      ['All-in-One Inkjet Printer',185000,'printers','Versatile printer for everyday document printing and basic home-office tasks.',images.office],
      ['Executive Notebook',8500,'office-supplies','Hard-cover notebook for meetings, planning, study and everyday notes.',images.office],
      ['Desktop Organiser',12500,'office-supplies','Compact organiser for pens, stationery and frequently used desk items.',images.office],
      ['Stapler and Punch Set',6500,'office-supplies','Essential desktop stationery set for everyday document handling.',images.office],
      ['Presentation Folder Pack',5800,'office-supplies','Professional presentation folders for reports, proposals and documents.',images.office],
    ],
  },
  {
    id:'catalog-vendor-10', name:'BuildRight Tools', email:'store10@tradease.ng', phone:'+2348100001010', category:'Industrial & Tools', logo:images.tools,
    products:[
      ['18V Cordless Drill',95000,'power-tools','Versatile cordless drill for household maintenance, assembly and light workshop tasks.',images.tools],
      ['Angle Grinder 900W',78000,'power-tools','Compact electric grinder for suitable cutting, grinding and workshop applications.',images.tools],
      ['Circular Saw',125000,'power-tools','Power tool designed for suitable wood-cutting and workshop applications.',images.tools],
      ['Protective Work Gloves',7500,'safety-equipment','Durable work gloves for general handling and suitable workshop tasks.',images.tools],
      ['Safety Helmet',9500,'safety-equipment','Protective helmet for appropriate construction and workshop environments.',images.tools],
      ['Reflective Safety Vest',6500,'safety-equipment','High-visibility vest for suitable roadside, warehouse and worksite environments.',images.tools],
      ['Heavy-Duty Extension Cable',18500,'building-materials','Durable extension cable for compatible workshop and household equipment.',images.tools],
      ['Measuring Tape 5m',5500,'building-materials','Compact measuring tape for household, workshop and construction measurements.',images.tools],
      ['Masonry Hand Tool Set',28000,'building-materials','Practical hand-tool selection for routine masonry and maintenance tasks.',images.tools],
      ['Adjustable Spanner Set',16000,'power-tools','Set of adjustable hand tools for routine workshop and maintenance work.',images.tools],
    ],
  },
  {
    id:'catalog-vendor-11', name:'GreenField Agro Mart', email:'store11@tradease.ng', phone:'+2348100001011', category:'Agriculture & Farm', logo:images.farm,
    products:[
      ['Hybrid Tomato Seeds Pack',8500,'seeds','Selected tomato seeds for gardens, small farms and commercial growers.',images.farm],
      ['Sweet Pepper Seeds Pack',7800,'seeds','Quality pepper seeds suitable for appropriate garden and farm cultivation.',images.farm],
      ['Maize Seeds 5kg',14500,'seeds','Maize seed pack suitable for seasonal farm planting.',images.farm],
      ['NPK Fertiliser 25kg',32000,'fertilisers','General-purpose fertiliser for appropriate crop nutrient management.',images.farm],
      ['Urea Fertiliser 25kg',29500,'fertilisers','Nitrogen fertiliser for suitable agricultural applications.',images.farm],
      ['Garden Hoe',12500,'farm-tools','Sturdy hand hoe for routine garden and small-farm cultivation.',images.tools],
      ['Pruning Shears',9500,'farm-tools','Hand pruning shears for suitable garden and crop maintenance tasks.',images.tools],
      ['Farm Hand Tool Set',28000,'farm-tools','Practical set of basic farm hand tools for routine cultivation and garden work.',images.tools],
      ['Watering Can 10L',8500,'farm-tools','Durable watering can for gardens, nurseries and small growing spaces.',images.farm],
      ['Seedling Nursery Tray Set',12000,'farm-tools','Reusable nursery trays for organised seedling propagation.',images.farm],
    ],
  },
  {
    id:'catalog-vendor-12', name:'Craft & Home Studio', email:'store12@tradease.ng', phone:'+2348100001012', category:'Handmade & Custom', logo:images.craft,
    products:[
      ['Handwoven Storage Basket',18500,'handmade-crafts','Hand-finished woven basket for storage, organisation and home display.',images.craft],
      ['Decorative Woven Tray',14500,'handmade-crafts','Handcrafted decorative tray for serving, organisation and interior styling.',images.craft],
      ['Handmade Beaded Accessory Set',12000,'handmade-crafts','Carefully assembled beaded accessories suitable for everyday styling and gifting.',images.craft],
      ['Abstract Canvas Wall Art',48000,'art','Decorative canvas artwork for modern living rooms, offices and bedrooms.',images.craft],
      ['Minimalist Framed Art Print',26000,'art','Clean framed art print designed for contemporary interior spaces.',images.craft],
      ['Custom Family Name Print',22000,'custom-prints','Personalised decorative print prepared with the customer’s chosen family name.',images.craft],
      ['Personalised Gift Box',30000,'custom-prints','Custom gift box arranged for birthdays, celebrations and thoughtful occasions.',images.craft],
      ['Handmade Scented Candle',14500,'handmade-crafts','Hand-poured decorative candle for home ambience and gifting.',images.craft],
      ['Custom Event Invitation Set',18000,'custom-prints','Personalised printed invitation set for suitable private events and celebrations.',images.craft],
      ['Decorative Clay Vase',24000,'handmade-crafts','Hand-finished decorative vase for shelves, tables and interior styling.',images.craft],
    ],
  },
];

const run = db.transaction(() => {
  db.exec(`CREATE TABLE IF NOT EXISTS starter_catalog_seed_runs (
    seed_id TEXT PRIMARY KEY,
    seeded_at TEXT NOT NULL DEFAULT (datetime('now')),
    product_count INTEGER NOT NULL DEFAULT 0,
    vendor_count INTEGER NOT NULL DEFAULT 0
  )`);

  const existing = db.prepare('SELECT seed_id FROM starter_catalog_seed_runs WHERE seed_id=?').get(SEED_ID) as any;
  if (existing) {
    console.log(`[catalog-seed] ${SEED_ID} has already been applied. Nothing to do.`);
    return { inserted: 0, vendors: 0, skipped: true };
  }

  // Existing Railway databases may have been created by an older build that
  // already has an admin/vendor but incomplete category rows. Products.category
  // is a foreign key, so the importer must repair/ensure the taxonomy before
  // inserting products. This is deliberately additive and does not delete data.
  const ensureCategory = db.prepare(`
    INSERT INTO categories (id,name,icon_name,color,display_order) VALUES (?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET name=excluded.name,icon_name=excluded.icon_name,display_order=excluded.display_order
  `);
  TRADEASE_CATALOG.forEach((c, index) => ensureCategory.run(c.id, c.name, c.iconName, null, index));
  for (const [legacyIndex, c] of [
    ['frozen-goods','Frozen Goods'], ['foodstuff','Foodstuff'], ['provisions','Provisions'],
    ['electronics','Electronics (Legacy)'], ['fashion','Fashion (Legacy)'], ['ebooks','E-Books (Legacy)'],
    ['food','Food & Groceries (Legacy)'], ['home','Home & Kitchen (Legacy)'], ['beauty','Beauty & Style (Legacy)']
  ].entries()) ensureCategory.run(c[0], c[1], null, null, 100 + legacyIndex);

  const upsertVendor = db.prepare(`
    INSERT INTO vendors (id,user_id,name,email,phone,status,store_category,rating,joining_date,kyc_status,logo,account_status,store_status,payout_status)
    VALUES (?,?,?,?,?,'Approved',?,0,date('now'),'Unverified',?,'Active','Active','On Hold')
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name,email=excluded.email,phone=excluded.phone,
      store_category=excluded.store_category,logo=excluded.logo,
      status='Approved',rating=0,kyc_status='Unverified',account_status='Active',store_status='Active',payout_status='On Hold'
  `);

  const upsertProduct = db.prepare(`
    INSERT INTO products (id,title,price,original_price,image,rating,reviews_count,category,subcategory,description,vendor_name,vendor_id,is_featured,stock,images,specifications)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET
      title=excluded.title,price=excluded.price,original_price=excluded.original_price,image=excluded.image,
      category=excluded.category,subcategory=excluded.subcategory,description=excluded.description,
      vendor_name=excluded.vendor_name,vendor_id=excluded.vendor_id,is_featured=excluded.is_featured,
      stock=excluded.stock,images=excluded.images,specifications=excluded.specifications,updated_at=datetime('now')
  `);

  let count = 0;
  for (const vendor of vendors) {
    upsertVendor.run(vendor.id, null, vendor.name, vendor.email, vendor.phone, vendor.category, vendor.logo);
    vendor.products.forEach((input, index) => {
      const p: ProductDef = Array.isArray(input)
        ? { title: input[0], price: input[1], subcategory: input[2], description: input[3], image: input[4] }
        : input;
      const id = `${vendor.id}-product-${String(index + 1).padStart(2,'0')}`;
      const original = Math.round(p.price * 1.08);
      const featured = index === 0 ? 1 : 0;
      const stock = 12 + ((index * 7) % 39);
      const specifications = JSON.stringify({
        Availability: 'In stock',
        Seller: vendor.name,
        Category: vendor.category,
        Fulfilment: 'TradeEase delivery options available at checkout'
      });
      upsertProduct.run(
        id, p.title, p.price, original, p.image, 0, 0,
        vendor.category === 'Fashion & Apparel' ? 'fashion-apparel' :
        vendor.category === 'Electronics & Gadgets' ? 'electronics-gadgets' :
        vendor.category === 'Home & Kitchen' ? 'home-kitchen' :
        vendor.category === 'Beauty, Health & Personal Care' ? 'beauty-health-personal-care' :
        vendor.category === 'Grocery & Food' ? 'grocery-food' :
        vendor.category === 'Automotive' ? 'automotive' :
        vendor.category === 'Baby & Kids' ? 'baby-kids' :
        vendor.category === 'Sports & Fitness' ? 'sports-fitness' :
        vendor.category === 'Industrial & Tools' ? 'industrial-tools' :
        vendor.category === 'Office & Stationery' ? 'office-stationery' :
        vendor.category === 'Agriculture & Farm' ? 'agriculture-farm' : 'handmade-custom',
        p.subcategory, p.description, vendor.name, vendor.id, featured, stock,
        JSON.stringify([p.image]), specifications
      );
      count++;
    });
  }

  db.prepare('INSERT INTO starter_catalog_seed_runs(seed_id,product_count,vendor_count) VALUES(?,?,?)').run(SEED_ID,count,vendors.length);
  return { inserted: count, vendors: vendors.length, skipped: false };
});

const result = run();
console.log(`[catalog-seed] ${result.skipped ? 'Already applied.' : `Added ${result.inserted} products across ${result.vendors} storefronts.`}`);
