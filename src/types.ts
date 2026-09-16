export type UserRole = 'buyer' | 'vendor';

export type AppState = 'splash' | 'walkthrough' | 'auth' | 'location' | 'main' | 'admin';

export interface UserSession {
  id?: string; // backend user id (present for 'local' accounts created via the REST API)
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  provider: 'local' | 'google' | 'facebook' | 'apple';
  role?: 'buyer' | 'vendor';
  emailVerified?: boolean;
  totpEnabled?: boolean;
}

export interface DigitalSpecification {
  fileType: 'PDF' | 'EPUB';
  watermarkText?: string;
  encryptionKey?: string;
  obfuscateMetadata?: boolean;
  lockSharing?: boolean;
  restrictTransfer?: boolean;
  originalFileName?: string;
  originalSize?: string;
  encryptedFileName?: string;
  shaHash?: string;
}

export interface Product {
  id: string;
  title: string;
  price: number;
  originalPrice: number;
  image: string;
  rating: number;
  reviewsCount: number;
  category: string;
  description: string;
  vendorName: string;
  vendorId: string;
  isFeatured: boolean;
  stock: number;
  digitalSpecification?: DigitalSpecification;
  // null/undefined = uses the vendor's rate, or the platform default if
  // the vendor has no override either.
  commissionPercent?: number | null;
}

export interface Category {
  id: string;
  name: string;
  iconName: string; // references lucide icon
  color: string; // Tailwind hex or class prefix for backgrounds
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface LogisticsProvider {
  id: string;
  name: string; // e.g. "DELIVERI", "UPS Express", "DHL Express", "FedEx Priority", "GIG Logistics", "Red Star Express"
  code: string;
  type: 'API' | 'Webhook' | 'API_and_Webhook';
  status: 'active' | 'inactive' | 'testing';
  apiEndpoint?: string;
  apiKey?: string;
  webhookUrl?: string;
  webhookSecret?: string;
  baseFee: number;
  perKmRate: number;
  estimatedDays: string;
  badge?: string;
  description: string;
  rating: number;
  supportedServices: string[];
  trackingUrlTemplate?: string;
}

export interface Order {
  id: string;
  buyerName: string;
  buyerPhone: string;
  city: string;
  state: string;
  address: string;
  items: {
    productId: string;
    productTitle: string;
    price: number;
    quantity: number;
    image: string;
  }[];
  totalAmount: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  date: string;
  shippingMethod?: string;
  shippingCost?: number;
  logisticsProviderId?: string;
  logisticsProviderName?: string;
  trackingNumber?: string;
  carrierStatus?: string;
  deliveriTrackingNumber?: string;
  deliveriStatus?: string;
  paymentMethod?: 'wallet' | 'bank' | 'card';
  paymentStatus?: 'Pending' | 'Paid' | 'Failed';
  paymentReference?: string;
}

export interface NigeriaState {
  name: string;
  cities: string[];
}

export interface SupportMessage {
  id: string;
  sender: 'user' | 'admin';
  content: string;
  senderName: string;
  timestamp: string;
}

export interface SupportChatSession {
  id: string; // unique ID
  userName: string;
  userRole: 'buyer' | 'vendor';
  userEmail: string;
  status: 'active' | 'resolved';
  messages: SupportMessage[];
  lastMessageAt: string;
}

