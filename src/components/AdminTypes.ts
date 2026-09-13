import { Product, Order } from '../types';

export type AdminTab = 'dashboard' | 'users' | 'vendors' | 'products' | 'orders' | 'payments' | 'reports' | 'settings' | 'deliveri' | 'support' | 'kyc';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'buyer' | 'vendor' | 'admin';
  status: 'Active' | 'Suspended';
  phone: string;
  dateJoined: string;
  totalOrders: number;
  totalSpent: number;
}

export interface AdminVendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  totalProducts: number;
  totalSales: number;
  rating: number;
  joiningDate: string;
  storeCategory: string;
}

export interface Transaction {
  id: string;
  buyerName: string;
  email: string;
  amount: number;
  status: 'success' | 'failed' | 'reversed' | 'pending';
  paymentMethod: 'Paystack' | 'Flutterwave' | 'Bank Transfer' | 'Card' | 'Wallet';
  date: string;
  reference: string;
}

export interface ForumReport {
  id: string;
  reporterName: string;
  subject: string;
  type: 'Product Dispute' | 'Failed Payout' | 'Seller Fraud' | 'Delivery Complaint';
  status: 'Open' | 'Resolved' | 'Investigating';
  date: string;
  description: string;
}

export interface AppSettings {
  appName: string;
  commissionPercent: number;
  paymentGateway: 'Paystack' | 'Flutterwave' | 'Dual';
  testMode: boolean;
  payoutFrequency: 'Daily' | 'Weekly' | 'Monthly';
  flatDeliveryFee: number;
  restrictedCategories: string[];
}
