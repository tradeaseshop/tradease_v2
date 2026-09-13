import { AdminUser, AdminVendor, Transaction, ForumReport, AppSettings } from './AdminTypes';

export const INITIAL_ADMIN_USERS: AdminUser[] = [
  {
    id: "usr-1",
    name: "Oluwaseun Adepoju",
    email: "seun.adepoju@gmail.com",
    role: "buyer",
    status: "Active",
    phone: "+234 812 345 6789",
    dateJoined: "2025-10-12",
    totalOrders: 14,
    totalSpent: 425000
  },
  {
    id: "usr-2",
    name: "Chioma Nze",
    email: "chioma.nze@yahoo.com",
    role: "buyer",
    status: "Active",
    phone: "+234 905 112 3344",
    dateJoined: "2025-11-05",
    totalOrders: 8,
    totalSpent: 185000
  },
  {
    id: "usr-3",
    name: "Ibrahim Musa",
    email: "ibrahim.musa@gmail.com",
    role: "buyer",
    status: "Active",
    phone: "+234 803 998 7766",
    dateJoined: "2025-12-19",
    totalOrders: 3,
    totalSpent: 45000
  },
  {
    id: "usr-4",
    name: "Funmi Alao",
    email: "funmi.alao@gmail.com",
    role: "vendor",
    status: "Active",
    phone: "+234 816 443 1122",
    dateJoined: "2025-05-20",
    totalOrders: 0,
    totalSpent: 0
  },
  {
    id: "usr-fauch",
    name: "Fauch Agency",
    email: "fauchagency@gmail.com",
    role: "admin",
    status: "Active",
    phone: "+234 701 888 9999",
    dateJoined: "2025-01-01",
    totalOrders: 25,
    totalSpent: 1250000
  },
  {
    id: "usr-kunle",
    name: "Kunle Adeleke",
    email: "kunle.ade@gmail.com",
    role: "vendor",
    status: "Active",
    phone: "+234 80 5432 9876",
    dateJoined: "2025-11-20",
    totalOrders: 12,
    totalSpent: 512000
  },
  {
    id: "usr-amara",
    name: "Amara Nwosu",
    email: "amara.nwosu@yahoo.com",
    role: "buyer",
    status: "Active",
    phone: "+234 90 9123 5533",
    dateJoined: "2025-06-15",
    totalOrders: 5,
    totalSpent: 220000
  },
  {
    id: "usr-5",
    name: "Tunde Bakare",
    email: "tunde.bakare@outlook.com",
    role: "buyer",
    status: "Suspended",
    phone: "+234 703 445 9900",
    dateJoined: "2025-08-14",
    totalOrders: 21,
    totalSpent: 890000
  },
  {
    id: "usr-6",
    name: "Amina Bello",
    email: "amina.b@abuja.gov.ng",
    role: "buyer",
    status: "Active",
    phone: "+234 802 333 4444",
    dateJoined: "2026-01-10",
    totalOrders: 5,
    totalSpent: 112000
  },
  {
    id: "usr-7",
    name: "Emeka Okafor",
    email: "emeka.okafor@gmail.com",
    role: "vendor",
    status: "Active",
    phone: "+234 809 111 2233",
    dateJoined: "2025-04-15",
    totalOrders: 1,
    totalSpent: 12500
  }
];

export const INITIAL_ADMIN_VENDORS: AdminVendor[] = [
  {
    id: "vendor-1",
    name: "Lagos Gadget Hub",
    email: "sales@lagosgadgethub.com",
    phone: "+234 803 111 0000",
    status: "Approved",
    totalProducts: 5,
    totalSales: 2100000,
    rating: 4.7,
    joiningDate: "2025-01-15",
    storeCategory: "Electronics"
  },
  {
    id: "vendor-2",
    name: "Alara Tailoring House",
    email: "info@alara.ng",
    phone: "+234 812 222 3333",
    status: "Approved",
    totalProducts: 4,
    totalSales: 1650000,
    rating: 4.9,
    joiningDate: "2025-03-22",
    storeCategory: "Fashion"
  },
  {
    id: "vendor-3",
    name: "Wealth Creators Press",
    email: "author@wealthcreators.com",
    phone: "+234 905 555 4444",
    status: "Approved",
    totalProducts: 3,
    totalSales: 950000,
    rating: 4.8,
    joiningDate: "2025-02-10",
    storeCategory: "E-Books"
  },
  {
    id: "vendor-4",
    name: "Aba Master Crafts",
    email: "aba.master@gmail.com",
    phone: "+234 703 888 9999",
    status: "Approved",
    totalProducts: 4,
    totalSales: 1120000,
    rating: 4.6,
    joiningDate: "2025-04-05",
    storeCategory: "Fashion"
  },
  {
    id: "vendor-5",
    name: "Naija Whole Foods",
    email: "foods@naijawhole.com",
    phone: "+234 816 777 8888",
    status: "Approved",
    totalProducts: 6,
    totalSales: 870000,
    rating: 4.8,
    joiningDate: "2025-06-12",
    storeCategory: "Food & Groceries"
  },
  {
    id: "vendor-6",
    name: "Naija Glow Organic",
    email: "hello@naijaglow.ng",
    phone: "+234 802 444 5555",
    status: "Approved",
    totalProducts: 4,
    totalSales: 640000,
    rating: 4.8,
    joiningDate: "2025-05-18",
    storeCategory: "Beauty & Style"
  },
  {
    id: "vendor-7",
    name: "The Glam Factory NG",
    email: "orders@glamfactoryng.com",
    phone: "+234 813 666 7777",
    status: "Approved",
    totalProducts: 2,
    totalSales: 420000,
    rating: 4.8,
    joiningDate: "2025-06-02",
    storeCategory: "Beauty & Style"
  },
  {
    id: "vendor-8",
    name: "Royal Heritage Cosmetics",
    email: "shop@royalheritage.ng",
    phone: "+234 807 222 1111",
    status: "Approved",
    totalProducts: 1,
    totalSales: 98000,
    rating: 4.7,
    joiningDate: "2025-07-09",
    storeCategory: "Beauty & Style"
  },
  {
    id: "vendor-pending-1",
    name: "Kano Spices & Grains",
    email: "kanospices@gmail.com",
    phone: "+234 802 887 5543",
    status: "Pending",
    totalProducts: 8,
    totalSales: 0,
    rating: 0.0,
    joiningDate: "2026-05-30",
    storeCategory: "Food & Groceries"
  },
  {
    id: "vendor-pending-2",
    name: "Oshodi Electronics",
    email: "oshodi.electricals@gmail.com",
    phone: "+234 809 334 2211",
    status: "Pending",
    totalProducts: 12,
    totalSales: 0,
    rating: 0.0,
    joiningDate: "2026-06-01",
    storeCategory: "Electronics"
  },
  {
    id: "vendor-pending-3",
    name: "Ibadan Agro-Tech Partners",
    email: "ibadan_agro@yahoo.com",
    phone: "+234 705 445 1289",
    status: "Pending",
    totalProducts: 4,
    totalSales: 0,
    rating: 0.0,
    joiningDate: "2026-06-02",
    storeCategory: "Home & Garden"
  },
  {
    id: "vendor-rejected-1",
    name: "Copycat PDF Store",
    email: "scampdf@gmail.com",
    phone: "+234 802 999 0000",
    status: "Rejected",
    totalProducts: 1,
    totalSales: 0,
    rating: 1.0,
    joiningDate: "2026-05-15",
    storeCategory: "E-Books"
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: "txn-1",
    buyerName: "Oluwaseun Adepoju",
    email: "seun.adepoju@gmail.com",
    amount: 198500,
    status: "success",
    paymentMethod: "Paystack",
    date: "2026-05-29 10:30",
    reference: "pstk-98305739-live"
  },
  {
    id: "txn-2",
    buyerName: "Chioma Nze",
    email: "chioma.nze@yahoo.com",
    amount: 65000,
    status: "success",
    paymentMethod: "Paystack",
    date: "2026-05-31 08:15",
    reference: "pstk-11234958-live"
  },
  {
    id: "txn-3",
    buyerName: "Ibrahim Musa",
    email: "ibrahim.musa@gmail.com",
    amount: 29000,
    status: "success",
    paymentMethod: "Bank Transfer",
    date: "2026-05-31 14:40",
    reference: "trsf-902111-local"
  },
  {
    id: "txn-4",
    buyerName: "Abiodun Sholanke",
    email: "abiodun.shola@gmail.com",
    amount: 380000,
    status: "success",
    paymentMethod: "Paystack",
    date: "2026-06-01 11:20",
    reference: "pstk-34589021-live"
  },
  {
    id: "txn-5",
    buyerName: "Chinedu Okafor",
    email: "chinedu.o@gmail.com",
    amount: 145000,
    status: "failed",
    paymentMethod: "Card",
    date: "2026-06-01 18:45",
    reference: "card-90412894-declined"
  },
  {
    id: "txn-6",
    buyerName: "Amina Bello",
    email: "amina.b@abuja.gov.ng",
    amount: 112000,
    status: "success",
    paymentMethod: "Paystack",
    date: "2026-06-02 09:12",
    reference: "pstk-90123847-live"
  },
  {
    id: "txn-7",
    buyerName: "Uche Benson",
    email: "uche.benson@yahoo.com",
    amount: 52000,
    status: "failed",
    paymentMethod: "Paystack",
    date: "2026-06-02 12:05",
    reference: "pstk-11228291-insufficient"
  }
];

export const INITIAL_REPORTS: ForumReport[] = [
  {
    id: "rep-1",
    reporterName: "Oluwaseun Adepoju",
    subject: "Oraimo FreePods audio imbalance",
    type: "Product Dispute",
    status: "Open",
    date: "2026-06-01",
    description: "The Oraimo FreePods delivered to me on plot 15 Admiralty Way has an audio issue where the left earpiece is completely silent. I have spoken with 'Lagos Gadget Hub' but they requested a payout release before replacement, which violates escrow procedures."
  },
  {
    id: "rep-2",
    reporterName: "Aba Master Crafts",
    subject: "Payout Delay for Batch 4 Suede Chelsea Boots",
    type: "Failed Payout",
    status: "Investigating",
    date: "2026-05-31",
    description: "Our store has shipped and tracking indicates the customer received the suede Chelsea boots 3 days ago. The funds are still sitting locked in escrow. Please execute direct clearance to our registered corporate bank account."
  },
  {
    id: "rep-3",
    reporterName: "Ibrahim Musa",
    subject: "Yam Elubo bag was cut open on transit",
    type: "Delivery Complaint",
    status: "Resolved",
    date: "2026-05-30",
    description: "The 5kg premium pack had a side laceration. The logistics driver from DELIVERI standard courier acknowledged it happened inside the van. Re-delivery or compensation has been cleared with the seller."
  }
];

export const DEFAULT_SETTINGS: AppSettings = {
  appName: "TradeEase Admin Portal",
  commissionPercent: 8.5,
  paymentGateway: "Paystack",
  testMode: false,
  payoutFrequency: "Daily",
  flatDeliveryFee: 3500,
  restrictedCategories: ["Alcohol", "Prescription Drugs", "Used Undergarments"]
};
