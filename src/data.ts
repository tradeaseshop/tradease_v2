import { Product, Category, NigeriaState, Order, LogisticsProvider } from './types';
import { ALL_PRODUCTS } from './productsData';

export const DEFAULT_LOGISTICS_PROVIDERS: LogisticsProvider[] = [
  {
    id: 'provider-deliveri',
    name: 'DELIVERI Logistics',
    code: 'deliveri',
    type: 'API_and_Webhook',
    status: 'active',
    apiEndpoint: 'https://api.deliveri.ng/v2/dispatch',
    apiKey: '',
    webhookUrl: 'https://tradeease.ng/api/webhooks/deliveri',
    webhookSecret: '',
    baseFee: 1500,
    perKmRate: 150,
    estimatedDays: '1 - 2 Days',
    badge: 'LOCAL STATE HUBS',
    description: 'Door-to-door transit and state bus terminal dispatch, with delivery confirmation built in.',
    rating: 4.8,
    supportedServices: ['Same-Day Terminal Pickup', 'Doorstep Inter-State', 'Delivery Confirmation', 'Rider Live GPS'],
    trackingUrlTemplate: 'https://deliveri.ng/track/{trackingNumber}'
  },
  {
    id: 'provider-ups',
    name: 'UPS Express',
    code: 'ups',
    type: 'API',
    status: 'active',
    apiEndpoint: 'https://onlinetools.ups.com/api/shipments/v1',
    apiKey: '',
    webhookUrl: 'https://tradeease.ng/api/webhooks/ups',
    webhookSecret: '',
    baseFee: 3500,
    perKmRate: 200,
    estimatedDays: '1 Day (Next-Day Air)',
    badge: 'GLOBAL EXPRESS',
    description: 'Worldwide & Nationwide express parcel routing with automated REST API dispatch and signature delivery guarantee.',
    rating: 4.9,
    supportedServices: ['Next-Day Air', 'Commercial Cargo', 'Restricted Electronics', 'API Parcel Barcode'],
    trackingUrlTemplate: 'https://www.ups.com/track?tracknum={trackingNumber}'
  },
  {
    id: 'provider-dhl',
    name: 'DHL Express',
    code: 'dhl',
    type: 'API_and_Webhook',
    status: 'active',
    apiEndpoint: 'https://express.api.dhl.com/mydhlapi/v1/shipments',
    apiKey: '',
    webhookUrl: 'https://tradeease.ng/api/webhooks/dhl',
    webhookSecret: '',
    baseFee: 4200,
    perKmRate: 250,
    estimatedDays: '1 - 2 Days Priority',
    badge: 'PRIORITY AIR',
    description: 'Premier international and domestic priority air freight with real-time Webhook tracking updates.',
    rating: 4.9,
    supportedServices: ['Priority Air Cargo', 'Express Worldwide', 'Realtime Webhooks', 'Customs Clearance'],
    trackingUrlTemplate: 'https://www.dhl.com/en/express/tracking.html?AWB={trackingNumber}'
  },
  {
    id: 'provider-fedex',
    name: 'FedEx Priority',
    code: 'fedex',
    type: 'API',
    status: 'active',
    apiEndpoint: 'https://apis.fedex.com/ship/v1/shipments',
    apiKey: '',
    webhookUrl: 'https://tradeease.ng/api/webhooks/fedex',
    webhookSecret: '',
    baseFee: 3800,
    perKmRate: 220,
    estimatedDays: '1 - 2 Days',
    badge: 'AIR CARGO',
    description: 'Interstate priority cargo and bulk freight with instant API dispatch and package insurance.',
    rating: 4.7,
    supportedServices: ['Priority Freight', 'Express Envelope', 'API Barcode Labels', 'Proof of Delivery'],
    trackingUrlTemplate: 'https://www.fedex.com/fedextrack/?trknbr={trackingNumber}'
  },
  {
    id: 'provider-gig',
    name: 'GIG Logistics',
    code: 'gig',
    type: 'Webhook',
    status: 'active',
    apiEndpoint: 'https://api.giglogistics.com/v1/shipment',
    apiKey: '',
    webhookUrl: 'https://tradeease.ng/api/webhooks/gig',
    webhookSecret: '',
    baseFee: 1800,
    perKmRate: 160,
    estimatedDays: '2 - 3 Days',
    badge: 'LOCAL COURIER',
    description: 'Extensive West Africa network with neighborhood hub pickups and automated Webhook order status callbacks.',
    rating: 4.6,
    supportedServices: ['Inter-State Bus Freight', 'Neighborhood Hub Pickups', 'Webhook Callback API'],
    trackingUrlTemplate: 'https://giglogistics.com/track/{trackingNumber}'
  },
  {
    id: 'provider-redstar',
    name: 'Red Star Express',
    code: 'redstar',
    type: 'API_and_Webhook',
    status: 'active',
    apiEndpoint: 'https://api.redstarexpressng.com/v1/dispatch',
    apiKey: '',
    webhookUrl: 'https://tradeease.ng/api/webhooks/redstar',
    webhookSecret: '',
    baseFee: 2000,
    perKmRate: 170,
    estimatedDays: '2 - 3 Days',
    badge: 'NATIONWIDE PARCEL',
    description: 'FedEx Licensee in Nigeria providing extensive coverage across all 36 states and 774 Local Government Areas.',
    rating: 4.5,
    supportedServices: ['All-State Coverage', 'Heavy Cargo', 'Webhook Event Stream'],
    trackingUrlTemplate: 'https://redstarexpressng.com/track/{trackingNumber}'
  }
];

export const NIGERIAN_STATES: NigeriaState[] = [
  {
    name: "Abia",
    cities: ["Umuahia", "Aba", "Ohafia", "Arochukwu"]
  },
  {
    name: "Adamawa",
    cities: ["Yola", "Mubi", "Jimeta", "Ganye"]
  },
  {
    name: "Akwa Ibom",
    cities: ["Uyo", "Eket", "Ikot Ekpene", "Oron"]
  },
  {
    name: "Anambra",
    cities: ["Awka", "Onitsha", "Nnewi", "Ekwulobia"]
  },
  {
    name: "Bauchi",
    cities: ["Bauchi", "Azare", "Misau", "Jama'are"]
  },
  {
    name: "Bayelsa",
    cities: ["Yenagoa", "Brass", "Ogbia", "Sagbama"]
  },
  {
    name: "Benue",
    cities: ["Makurdi", "Gboko", "Otukpo", "Katsina-Ala"]
  },
  {
    name: "Borno",
    cities: ["Maiduguri", "Biu", "Bama", "Gwoza"]
  },
  {
    name: "Cross River",
    cities: ["Calabar", "Ogoja", "Ikom", "Obudu"]
  },
  {
    name: "Delta",
    cities: ["Asaba", "Warri", "Sapele", "Ughelli"]
  },
  {
    name: "Ebonyi",
    cities: ["Abakaliki", "Afikpo", "Onueke", "Uburu"]
  },
  {
    name: "Edo",
    cities: ["Benin City", "Ekpoma", "Uromi", "Auchi"]
  },
  {
    name: "Ekiti",
    cities: ["Ado Ekiti", "Ikere Ekiti", "Oye Ekiti", "Aramoko"]
  },
  {
    name: "Enugu",
    cities: ["Enugu Urban", "Nsukka", "Achara Layout", "Coal Camp"]
  },
  {
    name: "FCT (Abuja)",
    cities: ["Maitama", "Wuse 2", "Garki", "Asokoro", "Gwarinpa", "Kubwa", "Jabi"]
  },
  {
    name: "Gombe",
    cities: ["Gombe", "Kaltungo", "Dukku", "Billiri"]
  },
  {
    name: "Imo",
    cities: ["Owerri", "Orlu", "Okigwe", "Mgbidi"]
  },
  {
    name: "Jigawa",
    cities: ["Dutse", "Hadejia", "Gumel", "Kazaure"]
  },
  {
    name: "Kaduna",
    cities: ["Kaduna City", "Zaria", "Kafanchan", "Kagoro"]
  },
  {
    name: "Kano",
    cities: ["Kano City", "Fagge", "Nassarawa", "Gwale"]
  },
  {
    name: "Katsina",
    cities: ["Katsina", "Daura", "Funtua", "Malumfashi"]
  },
  {
    name: "Kebbi",
    cities: ["Birnin Kebbi", "Argungu", "Yauri", "Zuru"]
  },
  {
    name: "Kogi",
    cities: ["Lokoja", "Okene", "Kabba", "Idah"]
  },
  {
    name: "Kwara",
    cities: ["Ilorin", "Offa", "Omu-Aran"]
  },
  {
    name: "Lagos",
    cities: ["Ikeja", "Lekki", "Victoria Island", "Surulere", "Yaba", "Maryland", "Ikoyi", "Apapa"]
  },
  {
    name: "Nasarawa",
    cities: ["Lafia", "Keffi", "Akwanga", "Karu"]
  },
  {
    name: "Niger",
    cities: ["Minna", "Bida", "Suleja", "Kontagora"]
  },
  {
    name: "Ogun",
    cities: ["Abeokuta", "Ijebu Ode", "Ota", "Sagamu"]
  },
  {
    name: "Ondo",
    cities: ["Akure", "Ondo City", "Owo", "Okitipupa"]
  },
  {
    name: "Osun",
    cities: ["Osogbo", "Ilesa", "Ife", "Ede"]
  },
  {
    name: "Oyo",
    cities: ["Ibadan", "Ogbomosho", "Bodija", "Samonda", "Oyo Town"]
  },
  {
    name: "Plateau",
    cities: ["Jos", "Bukuru", "Pankshin", "Shendam"]
  },
  {
    name: "Rivers",
    cities: ["Port Harcourt", "Rumuokoro", "GRA Phase 2", "Eleme", "Obio-Akpor"]
  },
  {
    name: "Sokoto",
    cities: ["Sokoto City", "Wurno", "Gwadabawa", "Tambuwal"]
  },
  {
    name: "Taraba",
    cities: ["Jalingo", "Wukari", "Bali", "Gashaka"]
  },
  {
    name: "Yobe",
    cities: ["Damaturu", "Potiskum", "Gashua", "Nguru"]
  },
  {
    name: "Zamfara",
    cities: ["Gusau", "Kaura Namoda", "Talata Mafara", "Anka"]
  }
];

export const CATEGORIES: Category[] = [
  { id: "electronics", name: "Electronics", iconName: "Smartphone", color: "bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400" },
  { id: "fashion", name: "Fashion", iconName: "Shirt", color: "bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400" },
  { id: "ebooks", name: "E-Books", iconName: "BookOpen", color: "bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400" },
  { id: "food", name: "Food & Groceries", iconName: "Utensils", color: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" },
  { id: "home", name: "Home & Kitchen", iconName: "Home", color: "bg-pink-100 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400" },
  { id: "beauty", name: "Beauty & Style", iconName: "Sparkles", color: "bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
];

export const INITIAL_PRODUCTS: Product[] = ALL_PRODUCTS;
/*
const DEPRECATED_INLINE_PRODUCTS = [
  // SECTION: Electronics
  {
    id: "prod-1",
    title: "Infinix Hot 40 Pro (256GB / 8GB RAM)",
    price: 195000,
    originalPrice: 210000,
    image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&q=80&w=600",
    rating: 4.7,
    reviewsCount: 104,
    category: "electronics",
    description: "The Infinix Hot 40 Pro offers top-tier gaming performance with an elite MediaTek Helio G99 processor, blazing fast 120Hz display refresh rate, and an advanced 108MP camera system. Exceptional battery health for busy entrepreneurs.",
    vendorName: "Lagos Gadget Hub",
    vendorId: "vendor-1",
    isFeatured: true,
    stock: 12
  },
  {
    id: "prod-6",
    title: "Anker Soundcore Motion+ Bluetooth Speaker",
    price: 68000,
    originalPrice: 75000,
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&q=80&w=600",
    rating: 4.8,
    reviewsCount: 144,
    category: "electronics",
    description: "Incredible Hi-Res 30W portable sound output with dual subwoofers and custom EQ from the Soundcore app. Waterproof and dustproof casing, ideal for off-grid power outages.",
    vendorName: "Lagos Gadget Hub",
    vendorId: "vendor-1",
    isFeatured: false,
    stock: 8
  },
  {
    id: "prod-elec-1",
    title: "Oraimo FreePods 4 Active Noise Cancelling Earbuds",
    price: 34500,
    originalPrice: 42000,
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&q=80&w=600",
    rating: 4.6,
    reviewsCount: 74,
    category: "electronics",
    description: "True wireless stereo earbuds featuring up to 35dB hybrid active noise cancellation, extremely rich heavy bass, slide gesture volume controls, and a whopping 35.5-hour total playtime with fast charge.",
    vendorName: "Lekki Tech Vault",
    vendorId: "vendor-1",
    isFeatured: true,
    stock: 25
  },
  {
    id: "prod-elec-2",
    title: "Samsung 43\" Crystal UHD 4K Smart TV",
    price: 380000,
    originalPrice: 410000,
    image: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&q=80&w=600",
    rating: 4.8,
    reviewsCount: 19,
    category: "electronics",
    description: "Enjoy stunning clarity and color with the Dynamic Crystal Display. Built-in Smart Hub, Alexa, and Google Assistant. Ultra slim profile perfectly mounts on any modern Nigerian wall setup.",
    vendorName: "Abuja Tech Distro",
    vendorId: "vendor-1",
    isFeatured: false,
    stock: 5
  },
  {
    id: "prod-elec-3",
    title: "HP Pavilion 15 Core i5 Laptop (16GB/512GB)",
    price: 450000,
    originalPrice: 485000,
    image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&q=80&w=600",
    rating: 4.5,
    reviewsCount: 31,
    category: "electronics",
    description: "A sleek, lightweight laptop powered by 11th Gen Intel Core i5 processors. Boasting 16GB dual channel RAM, blazing fast 512GB NVMe M.2 SSD, and back-lit keyboard. Perfect for coding, freelancing or virtual remote tasks.",
    vendorName: "Computer Village Depot",
    vendorId: "vendor-1",
    isFeatured: true,
    stock: 7
  },

  // SECTION: Fashion
  {
    id: "prod-2",
    title: "Traditional Unisex Agbada Set - Rich Blue",
    price: 65000,
    originalPrice: 80000,
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=600",
    rating: 4.9,
    reviewsCount: 38,
    category: "fashion",
    description: "Hand-crafted premium Nigerian Agbada wear, embroidered with detailed precision. Perfectly tailored using top-tier materials for weddings, ceremonial events, and Sunday best.",
    vendorName: "Alara Tailoring House",
    vendorId: "vendor-2",
    isFeatured: true,
    stock: 5
  },
  {
    id: "prod-4",
    title: "Premium Handcrafted Leather Slides",
    price: 18000,
    originalPrice: 25000,
    image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=600",
    rating: 4.5,
    reviewsCount: 52,
    category: "fashion",
    description: "Handmade purely from durable Italian calf leather right in Aba. Soft-cushion platform padding ensures maximum comfort under hot tropical days while retaining elegant presentation.",
    vendorName: "Aba Master Crafts",
    vendorId: "vendor-4",
    isFeatured: false,
    stock: 20
  },
  {
    id: "prod-fash-1",
    title: "Luxury Handcrafted Ankara Infinity Maxi Dress",
    price: 24000,
    originalPrice: 32000,
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=600",
    rating: 4.7,
    reviewsCount: 43,
    category: "fashion",
    description: "Stunning 100% African cotton wax Ankara print dress featuring adjustable multi-way straps. Enables more than 6 distinct styles - classic halter, off-shoulder, cross-front, and more. Vibrant hues representing beautiful local craft.",
    vendorName: "Ankara Queens Hub",
    vendorId: "vendor-2",
    isFeatured: true,
    stock: 14
  },
  {
    id: "prod-fash-2",
    title: "Men's Soft Italian Suede Chelsea Boots",
    price: 42000,
    originalPrice: 55000,
    image: "https://images.unsplash.com/photo-1638247025967-b4e38f787b76?auto=format&fit=crop&q=80&w=600",
    rating: 4.8,
    reviewsCount: 29,
    category: "fashion",
    description: "Water-resistant, genuine suede upper with flexible side panels and breathable leather linings. Exceptional craftsmanship from elite artisans, offering maximum foot comfort and formal elegance.",
    vendorName: "Aba Master Crafts",
    vendorId: "vendor-4",
    isFeatured: false,
    stock: 9
  },
  {
    id: "prod-fash-3",
    title: "Traditional Hand-woven Aso Oke Ceremonial Set",
    price: 95000,
    originalPrice: 115000,
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=600",
    rating: 5.0,
    reviewsCount: 16,
    category: "fashion",
    description: "Exquisite hand-woven Yoruba Aso Oke matching attire for couples. Highly textured, metallic-threaded luxury fabric tailored specifically for traditional engagements (Igbeyawo) or royal occasions.",
    vendorName: "Alara Tailoring House",
    vendorId: "vendor-2",
    isFeatured: true,
    stock: 3
  },
  {
    id: "prod-fash-4",
    title: "Rich Yoruba Isiagu Patterned Modern Blazer",
    price: 35000,
    originalPrice: 45000,
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=600",
    rating: 4.6,
    reviewsCount: 22,
    category: "fashion",
    description: "Fusing Igbo ethnic prints with ultra-modern suit silhouettes. Premium quality light wool-blend jacket with golden lion-head emblem buttons, providing a bold statement of African identity and elite standard.",
    vendorName: "Enugu Tailors Collective",
    vendorId: "vendor-2",
    isFeatured: false,
    stock: 6
  },

  // SECTION: E-books
  {
    id: "prod-3",
    title: "Side Hustle to Main Hustle (PDF E-Book)",
    price: 3500,
    originalPrice: 7000,
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600",
    rating: 4.8,
    reviewsCount: 215,
    category: "ebooks",
    description: "The complete guide to launching a successful multivendor product brand or business in Nigeria's dynamic economy. Includes templates for budgeting, logistics via local carriers, and social media monetization.",
    vendorName: "Wealth Creators Press",
    vendorId: "vendor-3",
    isFeatured: true,
    stock: 999
  },
  {
    id: "prod-eb-1",
    title: "Inside Nigeria's Tech Ecosystem (PDF Playbook)",
    price: 4500,
    originalPrice: 9000,
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=600",
    rating: 4.9,
    reviewsCount: 122,
    category: "ebooks",
    description: "A comprehensive analysis of Tech Cabal networks, funding routes, startup structures, and career roadmaps for engineers, product managers, and founders looking to secure remote foreign jobs from Nigeria.",
    vendorName: "Wealth Creators Press",
    vendorId: "vendor-3",
    isFeatured: false,
    stock: 999
  },
  {
    id: "prod-eb-2",
    title: "The Ultimate Real Estate Investing Blueprint in Lagos",
    price: 12000,
    originalPrice: 20000,
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=600",
    rating: 4.7,
    reviewsCount: 88,
    category: "ebooks",
    description: "Avoid 'Omonile' traps completely. Learn verified land registry research, governor's consent processes, high-yield off-plan purchases in Lekki, Ibeju-Lekki, and Ibadan, compiled by top legal specialists.",
    vendorName: "Naija Legal Partners",
    vendorId: "vendor-3",
    isFeatured: true,
    stock: 999
  },
  {
    id: "prod-eb-3",
    title: "Social Media Ad Mastery using Local Payment Hacks",
    price: 5000,
    originalPrice: 10000,
    image: "https://images.unsplash.com/photo-1432821596592-e2c18b78144f?auto=format&fit=crop&q=80&w=600",
    rating: 4.8,
    reviewsCount: 310,
    category: "ebooks",
    description: "Stop getting 'Card Declined' errors on Facebook, Instagram, and TikTok ads! This step-by-step PDF reveals the exact naira virtual cards and payment gateways that work flawlessly for running foreign ads from Nigeria.",
    vendorName: "Naija Growth Hacker",
    vendorId: "vendor-3",
    isFeatured: true,
    stock: 999
  },
  {
    id: "prod-eb-4",
    title: "High-Income Digital Freelancing for Nigerian Creators",
    price: 3500,
    originalPrice: 8000,
    image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=80&w=600",
    rating: 4.5,
    reviewsCount: 145,
    category: "ebooks",
    description: "Discover how to target international clients on Upwork and Fiverr, write winning proposals, set up verified foreign PayPal or Payoneer accounts, and convert your hard currency earnings at black-market rates.",
    vendorName: "Wealth Creators Press",
    vendorId: "vendor-3",
    isFeatured: false,
    stock: 999
  },
  {
    id: "prod-eb-5",
    title: "Mini-Importation and Global Sourcing Mastery Guide",
    price: 6000,
    originalPrice: 12000,
    image: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=600",
    rating: 4.9,
    reviewsCount: 204,
    category: "ebooks",
    description: "Start importing items like electronics, bags, and fashion from China/1688 with as low as 50,000 NGN. Covers direct messaging agents, cheap shipping logistics, custom clearances, and high-profit margins resale strategies.",
    vendorName: "Naija Growth Hacker",
    vendorId: "vendor-3",
    isFeatured: true,
    stock: 999
  },

  // SECTION: Food & Groceries
  {
    id: "prod-5",
    title: "Yam Flour (Elubo) - 5kg Premium Pack",
    price: 14500,
    originalPrice: 16000,
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=600",
    rating: 4.6,
    reviewsCount: 89,
    category: "food",
    description: "Finely ground premium yam flour for preparing smooth, lump-free Amala. Sourced from the fertile agricultural fields of Benue State and hygienic packaging guaranteed.",
    vendorName: "Naija Whole Foods",
    vendorId: "vendor-5",
    isFeatured: true,
    stock: 45
  },
  {
    id: "prod-food-1",
    title: "Premium Oloyin Honey Beans (Ewa Oloyin) - 10kg Bag",
    price: 22000,
    originalPrice: 26000,
    image: "https://images.unsplash.com/photo-1515942400758-4588f9a94764?auto=format&fit=crop&q=80&w=600",
    rating: 4.8,
    reviewsCount: 56,
    category: "food",
    description: "Naturally sweet, clean, and stone-free honey beans (Ewa Oloyin) packed under strict hygienic conditions. Ideal for making delicious local delicacies like Akara, Moin-Moin, or simple Gbegiri soup.",
    vendorName: "Naija Whole Foods",
    vendorId: "vendor-5",
    isFeatured: true,
    stock: 30
  },
  {
    id: "prod-food-2",
    title: "Royal Stallion Premium Caprice Rice (25kg local bag)",
    price: 45000,
    originalPrice: 48000,
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=600",
    rating: 4.7,
    reviewsCount: 112,
    category: "food",
    description: "High-grade premium parboiled rice. Stone-free, fast cooking, and excellent expansion ratio when boiled. The golden standard of Nigerian festive party Jollof rice.",
    vendorName: "Haleema Grain Stores",
    vendorId: "vendor-5",
    isFeatured: true,
    stock: 15
  },
  {
    id: "prod-food-3",
    title: "Naturally Sourced Cold-Pressed Palm Oil - 5 Litres",
    price: 13500,
    originalPrice: 15000,
    image: "https://images.unsplash.com/photo-1622484211148-716598e04141?auto=format&fit=crop&q=80&w=600",
    rating: 4.9,
    reviewsCount: 68,
    category: "food",
    description: "100% organic, low acidity, pure cold-pressed red palm oil. No artificial coloring or chemical additives. Sourced straight from regional palm farms in eastern Nigeria.",
    vendorName: "Naija Whole Foods",
    vendorId: "vendor-5",
    isFeatured: false,
    stock: 40
  },
  {
    id: "prod-food-4",
    title: "Organic Smoked Catfish Pack (Large 4-Pieces)",
    price: 16000,
    originalPrice: 18500,
    image: "https://images.unsplash.com/photo-1534482421-64566f976cfa?auto=format&fit=crop&q=80&w=600",
    rating: 4.8,
    reviewsCount: 41,
    category: "food",
    description: "Thoroughly washed, degutted, and naturally smoked catfish using organic hardwood kiln. Imparts marvelous local smoke scent to Egusi, Ogbono, or native Jollof rice dishes.",
    vendorName: "Calabar Catch Farms",
    vendorId: "vendor-5",
    isFeatured: true,
    stock: 22
  },
  {
    id: "prod-food-5",
    title: "Ginger & Turmeric Organic Herbal Wellness Tea Pack",
    price: 4500,
    originalPrice: 5500,
    image: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&q=80&w=600",
    rating: 4.6,
    reviewsCount: 29,
    category: "food",
    description: "Boost your immune system with natural ginger root, spicy turmeric, and organic lemon-grass blends. 25 individually sealed filter bags per pack, grown completely in central states.",
    vendorName: "Haleema Grain Stores",
    vendorId: "vendor-5",
    isFeatured: false,
    stock: 100
  },

  // SECTION: Home & Kitchen
  {
    id: "prod-7",
    title: "Non-Stick Ceramic Cookware Set (10 Pieces)",
    price: 85000,
    originalPrice: 105000,
    image: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&q=80&w=600",
    rating: 4.4,
    reviewsCount: 22,
    category: "home",
    description: "Premium double-coated eco ceramic cookware. Safe cooking without any Teflon toxins. Includes heat-resistant tempered glass lids and dynamic cold-touch handles matching modern Nigerian kitchens.",
    vendorName: "Kitchen Essentials NG",
    vendorId: "vendor-6",
    isFeatured: false,
    stock: 4
  },
  {
    id: "prod-home-1",
    title: "Rechargeable Solar Standing Fan with Smart Remote",
    price: 48000,
    originalPrice: 58000,
    image: "https://images.unsplash.com/photo-1618941716939-550fc335805f?auto=format&fit=crop&q=80&w=600",
    rating: 4.8,
    reviewsCount: 97,
    category: "home",
    description: "Never worry about power outages again. This heavy-duty rechargeable standing fan features a high-capacity lithium battery providing up to 12 hours of quiet breeze on low. Includes a neat 12W solar panel and USB ports for charging phones during emergencies.",
    vendorName: "Alaba Solar Hub",
    vendorId: "vendor-6",
    isFeatured: true,
    stock: 18
  },
  {
    id: "prod-home-2",
    title: "Centrifugal Smart Juice Extractor (800W Copper)",
    price: 38000,
    originalPrice: 45000,
    image: "https://images.unsplash.com/photo-1622343576253-3c9f23cc7fe6?auto=format&fit=crop&q=80&w=600",
    rating: 4.5,
    reviewsCount: 15,
    category: "home",
    description: "Extract highly nutritious pure juices from oranges, apples, pineapples, and veggies instantly. Features an extra-wide feed chute, 2-speed controls, and smart anti-drip lock. Durable full stainless-steel mesh filter.",
    vendorName: "Kitchen Essentials NG",
    vendorId: "vendor-6",
    isFeatured: false,
    stock: 8
  },
  {
    id: "prod-home-3",
    title: "Elegant Geometric Patterned Living Room Rug",
    price: 52000,
    originalPrice: 65000,
    image: "https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&q=80&w=600",
    rating: 4.7,
    reviewsCount: 39,
    category: "home",
    description: "A super plush, low-maintenance geometric carpet that elevates any living room space immediately. Woven with dirt-resistant polypropylene fibers, making it easy to vacuum and clean.",
    vendorName: "Deco Palace Nigeria",
    vendorId: "vendor-6",
    isFeatured: true,
    stock: 10
  },
  {
    id: "prod-home-4",
    title: "High-Speed 4-In-1 Blender & Smoothie Bullet",
    price: 28500,
    originalPrice: 35000,
    image: "https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&q=80&w=600",
    rating: 4.6,
    reviewsCount: 54,
    category: "home",
    description: "A powerhouse blender sporting cyclonic action stainless blades. Effortlessly grinds tough ingredients like local melon (Egusi), pepper mix, coffee beans, or makes ice cold protein smoothies in seconds.",
    vendorName: "Kitchen Essentials NG",
    vendorId: "vendor-6",
    isFeatured: false,
    stock: 15
  },
  {
    id: "prod-home-5",
    title: "Orthopedic Memory Foam Pillow (Anti-Neck Strain)",
    price: 19500,
    originalPrice: 24000,
    image: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&q=80&w=600",
    rating: 4.7,
    reviewsCount: 42,
    category: "home",
    description: "Ergonomically contoured pillow designed to adapt with your neck spine alignments perfectly. Made from therapeutic-grade foam with a highly breathable, washable cotton cover to guarantee restorative deep sleep.",
    vendorName: "Deco Palace Nigeria",
    vendorId: "vendor-6",
    isFeatured: false,
    stock: 25
  },

  // SECTION: Beauty & Style
  {
    id: "prod-beau-1",
    title: "Pure Organic Raw Shea Butter (Premium Grade A) - 500g Jar",
    price: 6000,
    originalPrice: 8000,
    image: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&q=80&w=600",
    rating: 4.9,
    reviewsCount: 150,
    category: "beauty",
    description: "100% natural, unrefined raw Shea Butter (Ori) sourced directly from local cooperatives in Kwara State. Hydrates and repairs dry skin, stimulates healthy hair growth, and clears stretch marks safely.",
    vendorName: "Naija Glow Organic",
    vendorId: "vendor-7",
    isFeatured: true,
    stock: 80
  },
  {
    id: "prod-beau-2",
    title: "Cold-Pressed Virgin Extra Coconut Hair & Skin Oil",
    price: 4500,
    originalPrice: 5500,
    image: "https://images.unsplash.com/photo-1624451860111-2334599a27e0?auto=format&fit=crop&q=80&w=600",
    rating: 4.8,
    reviewsCount: 94,
    category: "beauty",
    description: "Lightweight, aromatic, non-greasy virgin coconut oil. Strengthens hair shafts, fights beard dandruff, and locks in deep moisture when applied directly on wet skins.",
    vendorName: "Naija Glow Organic",
    vendorId: "vendor-7",
    isFeatured: false,
    stock: 120
  },
  {
    id: "prod-beau-3",
    title: "Advanced Hydrant Anti-Acne Organic Facial Clay Mask",
    price: 12500,
    originalPrice: 15000,
    image: "https://images.unsplash.com/photo-1567894340315-735d7c361db0?auto=format&fit=crop&q=80&w=600",
    rating: 4.7,
    reviewsCount: 49,
    category: "beauty",
    description: "Infused with natural bentonite minerals, tea tree oils, and organic green tea extracts. Deeply cleanses oily facial pores, sucks out blackheads, and calms acne flare-ups without drying.",
    vendorName: "The Glam Factory NG",
    vendorId: "vendor-7",
    isFeatured: true,
    stock: 35
  },
  {
    id: "prod-beau-4",
    title: "Matte Liquid Velvet Lipstick Set (4 African Nude Tones)",
    price: 14000,
    originalPrice: 18000,
    image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&q=80&w=600",
    rating: 4.6,
    reviewsCount: 33,
    category: "beauty",
    description: "Long-wear, waterproof liquid lipstick set specially curated for dark and rich African skin tones. Rich cream velvet textures that stay comfortable up to 16 hours without cracking.",
    vendorName: "The Glam Factory NG",
    vendorId: "vendor-7",
    isFeatured: false,
    stock: 45
  },
  {
    id: "prod-beau-5",
    title: "Liquid Black Soap Premium Healing & Shower Gel (Dudu Mix)",
    price: 5500,
    originalPrice: 7000,
    image: "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&q=80&w=600",
    rating: 4.8,
    reviewsCount: 167,
    category: "beauty",
    description: "Formulated with native black soap bases, pure honey, aloe vera, and neem extracts. Effectively resolves body bumps, skin irritation, and evens out overall complexions.",
    vendorName: "Naija Glow Organic",
    vendorId: "vendor-7",
    isFeatured: true,
    stock: 65
  },
  // NEW ELECTRONICS ADDITIONS
  {
    id: "prod-elec-4",
    title: "Oraimo Wireless Fast Charge Power Bank (20,000mAh)",
    price: 29500,
    originalPrice: 38000,
    image: "https://images.unsplash.com/photo-1609592424109-dd9e763de99d?auto=format&fit=crop&q=80&w=600",
    rating: 4.8,
    reviewsCount: 231,
    category: "electronics",
    description: "Equipped with advanced AniFast high-speed technology, an LED super-bright flashlight torch, digital battery power percentage display, and multiple high-output USB-C ports to withstand heavy local power Cuts.",
    vendorName: "Lekki Tech Vault",
    vendorId: "vendor-1",
    isFeatured: true,
    stock: 45
  },
  {
    id: "prod-elec-5",
    title: "Anker Soundcore Life Q20 Hybrid Active Noise Cancelling Headphones",
    price: 88000,
    originalPrice: 95000,
    image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&q=80&w=600",
    rating: 4.7,
    reviewsCount: 65,
    category: "electronics",
    description: "Experience exceptional Hi-Res Audio and advanced active noise cancellation that reduces low-frequency rumble by up to 90%. Exceptional memory-protein ear cups with a premium 40-hour deep battery cycle.",
    vendorName: "Lagos Gadget Hub",
    vendorId: "vendor-1",
    isFeatured: false,
    stock: 12
  },
  // NEW FASHION ADDITIONS
  {
    id: "prod-fash-5",
    title: "Premium Handcrafted Silk Bubu Kaftan - Sunshine Ochre",
    price: 34000,
    originalPrice: 42000,
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=600",
    rating: 4.9,
    reviewsCount: 47,
    category: "fashion",
    description: "Flowing luxury silk Bubu Gown tailored to absolute perfection. Designed with detailed golden thread embroidery along the elegant neckline, making it perfect for classy evening gatherings and prestigious celebrations.",
    vendorName: "Ankara Queens Hub",
    vendorId: "vendor-2",
    isFeatured: true,
    stock: 10
  },
  {
    id: "prod-fash-6",
    title: "Luxury Royal Coral Bead Traditional Wedding Necklace Set",
    price: 58000,
    originalPrice: 70000,
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600",
    rating: 5.0,
    reviewsCount: 22,
    category: "fashion",
    description: "Heavy-layered traditional bridal and groom coral beads, hand-sourced and carefully strung by historical artisans. Brings magnificent royal elegance and cultural premium to your special traditional wedding days.",
    vendorName: "Benin Heritage Crafts",
    vendorId: "vendor-4",
    isFeatured: false,
    stock: 4
  },
  // NEW E-BOOKS ADDITIONS
  {
    id: "prod-eb-6",
    title: "The Content Creator Playbook: N1 Million Monthly Routine",
    price: 4500,
    originalPrice: 9000,
    image: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&q=80&w=600",
    rating: 4.8,
    reviewsCount: 153,
    category: "ebooks",
    description: "Learn how local creators successfully monetize TikTok, YouTube, and Facebook Reels. Written by an active Lagos content strategist, explaining direct sponsorship outreach, pitch files, and high-payout brand integrations.",
    vendorName: "Naija Growth Hacker",
    vendorId: "vendor-3",
    isFeatured: true,
    stock: 999
  },
  {
    id: "prod-eb-7",
    title: "Japa Roadmap: The Master Checklist for Express Entry",
    price: 7500,
    originalPrice: 15000,
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=600",
    rating: 4.9,
    reviewsCount: 189,
    category: "ebooks",
    description: "An incredibly detailed step-by-step PDF detailing immigration routes, student pathways, securing tech fellowships, evaluation validation templates and safe relocation planning for Nigerian professionals.",
    vendorName: "Naija Legal Partners",
    vendorId: "vendor-3",
    isFeatured: false,
    stock: 999
  },
  // NEW FOOD ADDITIONS
  {
    id: "prod-food-6",
    title: "Premium Sieved Ijebu Garri (Yellow) - 10kg Sack",
    price: 16500,
    originalPrice: 20000,
    image: "https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&q=80&w=600",
    rating: 4.9,
    reviewsCount: 142,
    category: "food",
    description: "Finely sieved, extremely crunchy yellow Ijebu Garri with that signature sharp sour tang. Handpicked from certified processors inside Ogun state, processed completely sand-free and stone-free.",
    vendorName: "Naija Whole Foods",
    vendorId: "vendor-5",
    isFeatured: true,
    stock: 50
  },
  {
    id: "prod-food-7",
    title: "Naturally Dried Hibiscus Flower Petals (Zobo Bag) - Bulk Pack",
    price: 6500,
    originalPrice: 8000,
    image: "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?auto=format&fit=crop&q=80&w=600",
    rating: 4.7,
    reviewsCount: 53,
    category: "food",
    description: "Deep crimson, carefully sun-dried premium Nigerian Roselle hibiscus calyces. Ideal for preparing flavorful, antioxidant-rich, natural zobo herbal brews with ginger or fruit juices.",
    vendorName: "Haleema Grain Stores",
    vendorId: "vendor-5",
    isFeatured: false,
    stock: 85
  },
  // NEW HOME ADDITIONS
  {
    id: "prod-home-6",
    title: "Smart USB Rechargeable Automatic 5-Gallon Water Pump",
    price: 8500,
    originalPrice: 12000,
    image: "https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&q=80&w=600",
    rating: 4.6,
    reviewsCount: 78,
    category: "home",
    description: "Fits perfectly on standard heavy 5-gallon water dispenser jars. One-button smart flow operation, USB rechargeable high-duration lithium battery, and clean stainless-steel outlet piping.",
    vendorName: "Kitchen Essentials NG",
    vendorId: "vendor-6",
    isFeatured: true,
    stock: 40
  },
  {
    id: "prod-home-7",
    title: "Digital Multi-Function Electric Pressure Cooker (6-Litres)",
    price: 49500,
    originalPrice: 62000,
    image: "https://images.unsplash.com/photo-1544233726-9f1d2b27be8b?auto=format&fit=crop&q=80&w=600",
    rating: 4.8,
    reviewsCount: 44,
    category: "home",
    description: "Cuts down traditional cooking duration by up to 70%! Ideal for rapid, tender boiling of organic tough meat, local beans, and preparing delicious one-pot meals with computerized safety guards.",
    vendorName: "Kitchen Essentials NG",
    vendorId: "vendor-6",
    isFeatured: false,
    stock: 11
  },
  // NEW BEAUTY ADDITIONS
  {
    id: "prod-beau-6",
    title: "Cold-Pressed Organic Beard Growth & Conditioning Trio",
    price: 9500,
    originalPrice: 13000,
    image: "https://images.unsplash.com/photo-1626015713026-d837d17240c2?auto=format&fit=crop&q=80&w=600",
    rating: 4.8,
    reviewsCount: 38,
    category: "beauty",
    description: "Complete treatment containing beard growth serum, organic sandalwood balm, and wooden pocket comb. Energized with pure castor and hemp seeds for healthy beard fullness and thick sheen.",
    vendorName: "Naija Glow Organic",
    vendorId: "vendor-7",
    isFeatured: true,
    stock: 55
  },
  {
    id: "prod-beau-7",
    title: "Deep Cleansing Mineral Face Wash with Salicylic Acid",
    price: 7800,
    originalPrice: 10000,
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=600",
    rating: 4.7,
    reviewsCount: 61,
    category: "beauty",
    description: "Fights persistent pimples and oily skin shine. Gentle, pH-balanced foaming facial scrub packed with salicylic acid tree oils to yield bright, fresh, and clear complexions under dusty environments.",
    vendorName: "The Glam Factory NG",
    vendorId: "vendor-7",
    isFeatured: false,
    stock: 38
  }
];
*/

export const INITIAL_ORDERS: Order[] = [
  {
    id: "TE-7894",
    buyerName: "Oluwaseun Adepoju",
    buyerPhone: "+234 812 345 6789",
    city: "Lekki",
    state: "Lagos",
    address: "Plot 15, Admiralty Way",
    items: [
      {
        productId: "prod-1",
        productTitle: "Infinix Hot 40 Pro (256GB / 8GB RAM)",
        price: 195000,
        quantity: 1,
        image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&q=80&w=600"
      },
      {
        productId: "prod-3",
        productTitle: "Side Hustle to Main Hustle (PDF E-Book)",
        price: 3500,
        quantity: 1,
        image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600"
      }
    ],
    totalAmount: 198500,
    status: "Delivered",
    date: "2026-05-29T10:30:00Z"
  },
  {
    id: "TE-4412",
    buyerName: "Chioma Nze",
    buyerPhone: "+234 905 112 3344",
    city: "Wuse 2",
    state: "FCT (Abuja)",
    address: "Rowan Plaza, Aminu Kano Crescent",
    items: [
      {
        productId: "prod-2",
        productTitle: "Traditional Unisex Agbada Set - Rich Blue",
        price: 65000,
        quantity: 1,
        image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=600"
      }
    ],
    totalAmount: 65000,
    status: "Processing",
    date: "2026-05-31T08:15:00Z"
  },
  {
    id: "TE-9011",
    buyerName: "Ibrahim Musa",
    buyerPhone: "+234 803 998 7766",
    city: "Kano City",
    state: "Kano",
    address: "42 Zoo Road",
    items: [
      {
        productId: "prod-5",
        productTitle: "Yam Flour (Elubo) - 5kg Premium Pack",
        price: 14500,
        quantity: 2,
        image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=600"
      }
    ],
    totalAmount: 29000,
    status: "Pending",
    date: "2026-05-31T14:40:00Z"
  }
];
