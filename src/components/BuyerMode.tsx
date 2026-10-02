import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, ShoppingCart, Home, Grid, User, Star, Plus, Minus, X, Check, MapPin, 
  Trash2, Package, Smartphone, Shirt, BookOpen, Utensils, Sparkles, Building2, Bell, ShieldCheck, LogOut, LogIn,
  Wallet, ChevronLeft, ChevronRight, Settings, Edit3, CreditCard, ArrowUpRight, Lock, Shield, ArrowLeft, Truck, Calendar,
  Compass, RefreshCw, Target, MessageCircle, Download, AlertTriangle
} from 'lucide-react';
import { Product, Category, CartItem, Order, UserSession, LogisticsProvider } from '../types';
import { CATEGORIES, DEFAULT_LOGISTICS_PROVIDERS } from '../data';
import { TRADEASE_CATALOG, CATALOG_BY_ID } from '../catalogTaxonomy';
import * as api from '../api';
import Logo from './Logo';
import AccountSecurityPanel from './AccountSecurityPanel';

export interface StatusToast {
  id: string;
  orderId: string;
  oldStatus: Order['status'];
  newStatus: Order['status'];
  title: string;
  msg: string;
}

// Helper Map to safely resolve string icon names dynamically
const IconMap: Record<string, React.ComponentType<any>> = {
  Smartphone,
  Shirt,
  BookOpen,
  Utensils,
  Home,
  Sparkles,
  User,
  Package
};

// Premium campaigns for swipeable slider (Jumia spec)
const BANNER_CAMPAIGNS = [
  {
    id: 1,
    title: "⚡ Naija Flash Sales!",
    tagline: "Up to 45% discount on headphones, earbuds, and smartphones. Limited hours!",
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=600",
    actionLabel: "Explore Deals",
    color: "from-amber-600 to-red-700",
    badge: "TODAY ONLY"
  },
  {
    id: 2,
    title: "🚚 State Hub Free Delivery",
    tagline: "Avoid standard shipping costs by picking up at local state terminals instantly.",
    image: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=600",
    actionLabel: "Check Centers",
    color: "from-emerald-600 to-teal-700",
    badge: "FREE SHIPPING"
  },
  {
    id: 3,
    title: "🛡️ Buyer Protection",
    tagline: "Your payment is held safely and only released once you confirm your order arrived.",
    image: "https://images.unsplash.com/photo-1563013544-824ae1d704d3?auto=format&fit=crop&q=80&w=600",
    actionLabel: "How it works",
    color: "from-indigo-600 to-blue-700",
    badge: "SECURE PAYMENTS"
  }
];

// Featured vendor list with details (Jumia spec)
const FEATURED_VENDORS = [
  {
    id: "vendor-1",
    name: "Lagos Gadget Hub",
    category: "Electronics",
    logoColor: "bg-blue-500",
    verified: true,
    initials: "LG",
    tagline: "Premium Mobile Specialists"
  },
  {
    id: "vendor-2",
    name: "Alara Tailoring House",
    category: "Fashion & Native Wear",
    logoColor: "bg-purple-500",
    verified: true,
    initials: "AT",
    tagline: "Fine Hand-woven Tailoring"
  },
  {
    id: "vendor-4",
    name: "Aba Master Crafts",
    category: "Crafted Leatherwork",
    logoColor: "bg-amber-500",
    verified: true,
    initials: "AM",
    tagline: "Aba Quality Finished Footwear"
  },
  {
    id: "vendor-5",
    name: "Naija Whole Foods",
    category: "Groceries & Farm Goods",
    logoColor: "bg-emerald-500",
    verified: true,
    initials: "NW",
    tagline: "Stone-Free Grains, Tubers & Oils"
  },
  {
    id: "vendor-6",
    name: "Kitchen Essentials NG",
    category: "Home Cookware & Solars",
    logoColor: "bg-rose-500",
    verified: false,
    initials: "KE",
    tagline: "Durable Ceramic Home Gear"
  }
];

export const DELIVERI_OPTIONS = DEFAULT_LOGISTICS_PROVIDERS.map(p => ({
  id: p.id,
  name: p.name,
  cost: p.baseFee,
  time: p.estimatedDays,
  description: p.description
}));

interface BuyerModeProps {
  products: Product[];
  cart: CartItem[];
  onAddToCart: (product: Product) => void;
  onRemoveFromCart: (productId: string) => void;
  onUpdateCartQuantity: (productId: string, quantity: number) => void;
  onClearCart: () => void;
  orders: Order[];
  onPlaceOrder: (details: { 
    buyerName: string; 
    buyerPhone: string; 
    state: string; 
    city: string; 
    address: string; 
    shippingMethod?: string; 
    shippingCost?: number;
    logisticsProviderId?: string;
    logisticsProviderName?: string;
    trackingNumber?: string;
    carrierStatus?: string;
    paymentMethod?: 'wallet' | 'bank' | 'card';
    paymentStatus?: 'Pending' | 'Paid' | 'Failed';
    paymentReference?: string;
    lastMileKm?: number;
    deliveryUrgency?: 'economy' | 'speedy' | 'flash';
  }) => Promise<void>;
  location: { state: string; city: string };
  onRoleToggle: () => void;
  darkMode: boolean;
  onThemeToggle: () => void;
  currentUser: UserSession | null;
  onUserUpdated: (updates: Partial<UserSession>) => void;
  onLogout: () => void;
  onTriggerLogin: (preferredRole?: 'buyer' | 'vendor', mode?: 'login' | 'signup') => void;
  onUpdateOrderStatus?: (orderId: string, updatedStatus: Order['status']) => void;
}

export default function BuyerMode({
  products,
  cart,
  onAddToCart,
  onRemoveFromCart,
  onUpdateCartQuantity,
  onClearCart,
  orders,
  onPlaceOrder,
  location,
  onRoleToggle,
  darkMode,
  onThemeToggle,
  currentUser,
  onUserUpdated,
  onLogout,
  onTriggerLogin,
  onUpdateOrderStatus
}: BuyerModeProps) {
  // Navigation: 'home' | 'categories' | 'cart' | 'profile' | 'about'
  const [navTab, setNavTab] = useState<'home' | 'categories' | 'cart' | 'profile' | 'about' | 'sell'>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeGalleryImage, setActiveGalleryImage] = useState(0);
  useEffect(() => { setActiveGalleryImage(0); }, [selectedProduct?.id]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'shipping' | 'success'>('cart');
  
  // Checkout Form State
  const [checkoutName, setCheckoutName] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [checkoutAddress, setCheckoutAddress] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [selectedDeliveriId, setSelectedDeliveriId] = useState('provider-deliveri');
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'bank' | 'card'>('card');
  const [bankTransferRef, setBankTransferRef] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Dynamic Delivery Parameters based on Distance, weight, and speed/urgency
  const [deliveryUrgency, setDeliveryUrgency] = useState<'economy' | 'speedy' | 'flash'>('economy');
  const [lastMileKm, setLastMileKm] = useState<number>(5);

  const getProductEstimatedWeight = (category: string, title: string) => {
    const cat = (category || '').toLowerCase();
    const name = (title || '').toLowerCase();
    
    if (name.includes('ebook') || name.includes('epub') || name.includes('pdf') || cat.includes('book') || cat.includes('digital')) {
      return 0.0; // Digital delivery has zero weight!
    }
    if (name.includes('solar') || name.includes('battery') || name.includes('fan') || name.includes('generator') || cat.includes('solar') || cat.includes('device') || cat.includes('electronic')) {
      return 8.5; // Solar Panels & high-velocity fans are heavier hardware
    }
    if (cat.includes('food') || cat.includes('recipe') || name.includes('garri') || name.includes('yam') || name.includes('rice')) {
      return 5.0; // Food bag bulk cargo
    }
    if (cat.includes('beauty') || cat.includes('fashion') || name.includes('dress') || name.includes('clothing') || name.includes('makeup')) {
      return 0.65; // Light clothing cargo
    }
    return 1.4; // Average standard package weight
  };

  const getBaseStateDistanceKm = (stateName: string) => {
    const norm = (stateName || '').toLowerCase();
    
    if (norm.includes('lagos')) return 25; // Dispatching from Lagos TradeHub
    
    // South West region
    if (norm.includes('ogun')) return 90;
    if (norm.includes('oyo')) return 145;
    if (norm.includes('osun')) return 210;
    if (norm.includes('ondo')) return 240;
    if (norm.includes('ekiti')) return 280;
    
    // South South & South East
    if (norm.includes('edo') || norm.includes('benin')) return 310;
    if (norm.includes('delta')) return 370;
    if (norm.includes('anambra') || norm.includes('onitsha')) return 420;
    if (norm.includes('enugu')) return 510;
    if (norm.includes('imo') || norm.includes('owerri')) return 480;
    if (norm.includes('abia')) return 530;
    if (norm.includes('rivers') || norm.includes('port')) return 590;
    if (norm.includes('bayelsa')) return 620;
    if (norm.includes('akwa') || norm.includes('uyo')) return 640;
    if (norm.includes('cross') || norm.includes('calabar')) return 720;
    if (norm.includes('ebonyi')) return 540;
    
    // North Central (Middle Belt)
    if (norm.includes('kogi')) return 410;
    if (norm.includes('kwara') || norm.includes('ilorin')) return 330;
    if (norm.includes('fct') || norm.includes('abuja')) return 540;
    if (norm.includes('nasarawa')) return 610;
    if (norm.includes('niger')) return 490;
    if (norm.includes('benue')) return 630;
    if (norm.includes('plateau') || norm.includes('jos')) return 760;
    
    // North West
    if (norm.includes('kaduna')) return 710;
    if (norm.includes('kano')) return 960;
    if (norm.includes('katsina')) return 1020;
    if (norm.includes('jigawa')) return 1080;
    if (norm.includes('sokoto')) return 980;
    if (norm.includes('kebbi')) return 890;
    if (norm.includes('zamfara')) return 840;
    
    // North East
    if (norm.includes('bauchi')) return 920;
    if (norm.includes('gombe')) return 1100;
    if (norm.includes('yobe')) return 1190;
    if (norm.includes('borno') || norm.includes('maiduguri')) return 1320;
    if (norm.includes('adamawa')) return 1250;
    if (norm.includes('taraba')) return 910;
    
    return 450; // default state distance fallback
  };

  // Helper to dynamically calculate customized DELIVERI cost based on distance, weight & urgency level
  const getDynamicDeliveriCost = (baseCost: number) => {
    // 1. Weight Factor (Digital Ebooks have 0.0 KG, hence weight surcharge is completely waived)
    const totalWeightKg = cart.reduce((sum, item) => {
      const w = getProductEstimatedWeight(item.product.category, item.product.title);
      return sum + (item.quantity * w);
    }, 0);
    const weightSurcharge = Math.round(totalWeightKg * 300); // ₦300 per KG

    // 2. Distance Factor (Derived from dispatch state + custom user last mile slider tuning)
    const baseDistanceKm = getBaseStateDistanceKm(location.state);
    const totalDistanceKm = baseDistanceKm + lastMileKm;
    const distanceSurcharge = Math.round(totalDistanceKm * 15); // ₦15 per KM state route

    // 3. Urgency Speed Factor
    let urgencySurcharge = 0;
    if (deliveryUrgency === 'speedy') {
      urgencySurcharge = 1800; // Swift Express Priority Air routing
    } else if (deliveryUrgency === 'flash') {
      urgencySurcharge = 4500; // Flash Sameday priority helicopter or dedicated bike courier
    }

    return baseCost + weightSurcharge + distanceSurcharge + urgencySurcharge;
  };

  // Buyer wallet is server-side. Never seed or persist a fake/local balance.
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletTransactions, setWalletTransactions] = useState<api.WalletTransaction[]>([]);
  const [walletLoading, setWalletLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (!currentUser) {
      setWalletBalance(0);
      setWalletTransactions([]);
      return () => { active = false; };
    }
    setWalletLoading(true);
    api.getWallet()
      .then((data) => {
        if (!active) return;
        setWalletBalance(Number(data.balance || 0));
        setWalletTransactions(data.transactions || []);
      })
      .catch(() => {
        if (!active) return;
        setWalletBalance(0);
        setWalletTransactions([]);
      })
      .finally(() => { if (active) setWalletLoading(false); });
    return () => { active = false; };
  }, [currentUser?.id]);


  // Saved addresses list state
  const [savedAddresses, setSavedAddresses] = useState<string[]>(() => {
    const saved = localStorage.getItem('tradeease_saved_addresses');
    if (saved) return JSON.parse(saved);
    return [];
  });

  useEffect(() => {
    localStorage.setItem('tradeease_saved_addresses', JSON.stringify(savedAddresses));
  }, [savedAddresses]);

  // Profile fields state
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileEmail, setProfileEmail] = useState('');

  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name);
      setProfilePhone(currentUser.phone || '+234 812 345 6789');
      setProfileEmail(currentUser.email);
    }
  }, [currentUser]);

  // Jumia-style filters and components state
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [activePromoIndex, setActivePromoIndex] = useState(0);
  
  // Profile sub views: 'info' | 'wallet' | 'addresses' | 'edit-profile' | 'settings' | 'ebooks' | 'orders'
  const [profileSubTab, setProfileSubTab] = useState<'info' | 'wallet' | 'addresses' | 'edit-profile' | 'settings' | 'ebooks' | 'orders'>('info');
  const [accountToast, setAccountToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showAccountToast = (msg: string, type: 'success' | 'error') => {
    setAccountToast({ msg, type });
    setTimeout(() => setAccountToast(null), 3500);
  };

  // Data export & account deletion state (Settings tab, Privacy & Data card)
  const [dataExportLoading, setDataExportLoading] = useState(false);
  const [dataExportError, setDataExportError] = useState<string | null>(null);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState('');
  const [deleteAccountConfirmText, setDeleteAccountConfirmText] = useState('');
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);

  const handleDownloadMyData = async () => {
    setDataExportError(null);
    setDataExportLoading(true);
    try {
      const data = await api.exportAccountData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const datePart = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `tradeease-my-data-${datePart}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setDataExportError(err.message || 'Could not download your data. Please try again.');
    } finally {
      setDataExportLoading(false);
    }
  };

  const handleConfirmDeleteAccount = async () => {
    setDeleteAccountError(null);
    if (deleteAccountConfirmText.trim().toUpperCase() !== 'DELETE') {
      setDeleteAccountError('Please type DELETE to confirm.');
      return;
    }
    if (!deleteAccountPassword) {
      setDeleteAccountError('Enter your current password to confirm.');
      return;
    }
    setDeleteAccountLoading(true);
    try {
      await api.deleteAccount(deleteAccountPassword);
      setShowDeleteAccountModal(false);
      onLogout();
    } catch (err: any) {
      setDeleteAccountError(err.message || 'Could not delete your account. Please try again.');
    } finally {
      setDeleteAccountLoading(false);
    }
  };

  // Order search and filters
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'All' | 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'>('All');
  const [activeDisputeMessage, setActiveDisputeMessage] = useState<string | null>(null);

  // Order status live notification toast and tracker states
  const [statusToasts, setStatusToasts] = useState<StatusToast[]>([]);
  const prevStatusesRef = useRef<Record<string, Order['status']>>({});
  const isFirstMountRef = useRef(true);

  useEffect(() => {
    const prevStatuses = prevStatusesRef.current;
    const newStatuses: Record<string, Order['status']> = {};

    orders.forEach(order => {
      newStatuses[order.id] = order.status;
      
      const oldStatus = prevStatuses[order.id];
      if (oldStatus !== undefined && oldStatus !== order.status) {
        // Status changed!
        if (!isFirstMountRef.current) {
          const toastId = `status-toast-${Date.now()}-${order.id}`;
          
          let alertMsg = `Order ${order.id} status transitioned from ${oldStatus} to ${order.status}.`;
          if (order.status === 'Shipped') {
            alertMsg = `📦 Waybill ${order.id} has been dispatched! Your consignment is active on the interstate logistics network.`;
          } else if (order.status === 'Delivered') {
            alertMsg = `✅ Order ${order.id} is confirmed Delivered. Payment has been released to the vendor.`;
          } else if (order.status === 'Cancelled') {
            alertMsg = `⚠️ Waybill ${order.id} was Cancelled. Your payment will be refunded to your wallet.`;
          } else if (order.status === 'Processing') {
            alertMsg = `⚙️ Order ${order.id} updated to Processing. Supplier is preparation-sealing your goods.`;
          }

          const newToast: StatusToast = {
            id: toastId,
            orderId: order.id,
            oldStatus,
            newStatus: order.status,
            title: `Waybill Status Updated`,
            msg: alertMsg
          };

          setStatusToasts(prev => [...prev, newToast]);

          // Auto dismiss after 7 seconds
          setTimeout(() => {
            setStatusToasts(prev => prev.filter(t => t.id !== toastId));
          }, 7000);
        }
      }
    });

    prevStatusesRef.current = newStatuses;
    isFirstMountRef.current = false;
  }, [orders]);

  // E-book Decryption & Vault viewer states
  const [selectedEbookProduct, setSelectedEbookProduct] = useState<Product | null>(null);
  const [isDecryptingEbook, setIsDecryptingEbook] = useState<string | null>(null);
  const [decryptionSuccessMap, setDecryptionSuccessMap] = useState<Record<string, boolean>>({});
  const [activeEbookLogMap, setActiveEbookLogMap] = useState<Record<string, string[]>>({});
  const [downloadingEbook, setDownloadingEbook] = useState<string | null>(null);
  const [ebookDownloadError, setEbookDownloadError] = useState<Record<string, string>>({});
  const handleDownloadEbook = async (product: Product, format: 'epub' | 'pdf') => {
    const key = `${product.id}-${format}`;
    setDownloadingEbook(key);
    setEbookDownloadError(prev => ({ ...prev, [key]: '' }));
    try {
      await api.downloadEbookFile(product.id, format, `${product.title}.${format}`);
    } catch (err: any) {
      setEbookDownloadError(prev => ({ ...prev, [key]: err.message || 'Download failed' }));
    } finally {
      setDownloadingEbook(null);
    }
  };

  const runEbookDecryptorSimulation = (productId: string, watermarkText?: string) => {
    setIsDecryptingEbook(productId);
    const buyerEmail = currentUser ? currentUser.email : 'buyer@tradeease.com.ng';
    const logs = [
      "Confirming your purchase...",
      `Preparing your copy for ${buyerEmail}`,
      `Adding your personal watermark: "${watermarkText || 'Licensed to ' + buyerEmail}"`,
      "Your ebook is ready to read."
    ];

    setActiveEbookLogMap(prev => ({ ...prev, [productId]: [] }));
    setDecryptionSuccessMap(prev => ({ ...prev, [productId]: false }));

    logs.forEach((logLine, index) => {
      setTimeout(() => {
        setActiveEbookLogMap(prev => {
          const prevLogs = prev[productId] || [];
          return { ...prev, [productId]: [...prevLogs, `[${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}] ${logLine}`] };
        });
        if (index === logs.length - 1) {
          setIsDecryptingEbook(null);
          setDecryptionSuccessMap(prev => ({ ...prev, [productId]: true }));
        }
      }, (index + 1) * 200);
    });
  };

  // Real Paystack wallet funding state
  const [isFundingOverlayOpen, setIsFundingOverlayOpen] = useState(false);
  const [fundingAmount, setFundingAmount] = useState('');
  const [fundingStep, setFundingStep] = useState<'input' | 'processing' | 'success'>('input');
  const [fundingError, setFundingError] = useState('');
  const walletPaymentCompletedRef = useRef(false);

  // Address add & edit state
  const [newAddressInput, setNewAddressInput] = useState('');
  const [editingAddressIndex, setEditingAddressIndex] = useState<number | null>(null);

  // Profile preferences
  const [consentNotifications, setConsentNotifications] = useState(true);
  const [consentPaymentReminders, setConsentPaymentReminders] = useState(true);

  // Prefill shipping info if currentUser is logged in
  useEffect(() => {
    if (currentUser) {
      setCheckoutName(currentUser.name);
      if (currentUser.phone) {
        setCheckoutPhone(currentUser.phone);
      }
    } else {
      setCheckoutName('');
      setCheckoutPhone('');
    }
  }, [currentUser]);

  // Filtering products by category and vendor
  const canonicalCategory = (id: string) => ({ electronics:'electronics-gadgets', fashion:'fashion-apparel', home:'home-kitchen', beauty:'beauty-health-personal-care', food:'grocery-food', ebooks:'services-digital-products' } as Record<string,string>)[id] || id;
  let filteredProducts = selectedCategory === 'all' ? products : products.filter(p => canonicalCategory(p.category) === selectedCategory);
  if (selectedSubcategory !== 'all') filteredProducts = filteredProducts.filter(p => p.subcategory === selectedSubcategory);

  if (selectedVendorId) {
    filteredProducts = filteredProducts.filter(p => p.vendorId === selectedVendorId);
  }

  const featuredProducts = products.filter(p => p.isFeatured);

  const cartTotalAmount = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Switch categories easily
  const selectCategoryFilter = (catId: string) => {
    setSelectedSubcategory('all');
    setSelectedCategory(catId);
    setNavTab('home');
    setIsDrawerOpen(false);
  };

  // Loads Paystack's inline checkout script once, on demand, rather than on
  // every page load — most sessions never reach checkout.
  const loadPaystackScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if ((window as any).PaystackPop) {
        resolve();
        return;
      }
      const existing = document.getElementById('paystack-inline-script');
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('Could not load Paystack.')));
        return;
      }
      const script = document.createElement('script');
      script.id = 'paystack-inline-script';
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Could not load Paystack. Check your internet connection.'));
      document.body.appendChild(script);
    });
  };

  const startWalletFunding = async () => {
    if (!currentUser) {
      onTriggerLogin('buyer');
      return;
    }
    const amount = Number(fundingAmount);
    if (!Number.isFinite(amount) || amount < 100) {
      setFundingError('Enter at least ₦100.');
      return;
    }
    setFundingError('');
    walletPaymentCompletedRef.current = false;
    setFundingStep('processing');
    try {
      const config = await api.getPaymentConfig();
      if (!config.configured || !config.publicKey) {
        throw new Error('Paystack is not configured on TradeEase. Add the Live PAYSTACK_PUBLIC_KEY and PAYSTACK_SECRET_KEY to Railway Variables, then redeploy.');
      }
      if (!config.publicKey.startsWith('pk_live_') && !config.publicKey.startsWith('pk_test_')) {
        throw new Error('TradeEase has an invalid Paystack public key configuration. Check PAYSTACK_PUBLIC_KEY in Railway Variables.');
      }
      const prepared = await api.prepareWalletFunding(amount);
      if (!prepared.publicKey) throw new Error('TradeEase could not obtain the Paystack public key from the server.');
      await loadPaystackScript();
      const PaystackPop = (window as any).PaystackPop;
      if (!PaystackPop) throw new Error('Paystack checkout could not be loaded.');

      const handler = PaystackPop.setup({
        key: prepared.publicKey,
        email: prepared.email,
        amount: Math.round(prepared.amount * 100),
        currency: 'NGN',
        ref: prepared.reference,
        callback: async (response: { reference: string }) => {
          try {
            const verified = await api.verifyWalletFunding(response.reference);
            if (!verified.verified) throw new Error('Paystack payment could not be verified.');
            walletPaymentCompletedRef.current = true;
            setWalletBalance(Number(verified.balance || 0));
            const refreshed = await api.getWallet();
            setWalletTransactions(refreshed.transactions || []);
            setFundingStep('success');
          } catch (err: any) {
            setFundingStep('input');
            setFundingError(err.message || 'We could not verify the payment. If you were charged, contact TradeEase support with your Paystack reference.');
          }
        },
        onClose: () => {
          if (walletPaymentCompletedRef.current) return;
          setFundingStep('input');
          setFundingError('Payment window was closed before the payment was completed.');
        },
      });
      handler.openIframe();
    } catch (err: any) {
      setFundingStep('input');
      setFundingError(err.message || 'Unable to start Paystack payment. Please try again.');
    }
  };

  // Opens the Paystack card payment popup and resolves with the transaction
  // reference once the popup itself reports success. This reference still
  // has to be verified against the backend (see handleCheckoutSubmit) before
  // it's treated as a real payment — the popup's own "success" callback can
  // be triggered by anyone with devtools open, so it's never trusted alone.
  const openPaystackPopup = (amountNaira: number, email: string): Promise<string | null> => {
    return new Promise((resolve, reject) => {
      loadPaystackScript()
        .then(async () => {
          const config = await api.getPaymentConfig();
          if (!config.configured || !config.publicKey) {
            reject(new Error('Card payments are not set up yet on this store. Please choose another payment method.'));
            return;
          }
          const reference = `TE-PAY-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
          const handler = (window as any).PaystackPop.setup({
            key: config.publicKey,
            email: email || 'buyer@tradeease.com.ng',
            amount: Math.round(amountNaira * 100), // Paystack expects kobo
            currency: 'NGN',
            ref: reference,
            callback: () => resolve(reference),
            onClose: () => resolve(null),
          });
          handler.openIframe();
        })
        .catch(reject);
    });
  };

  // Run Order logic
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutName || !checkoutPhone || !checkoutAddress) {
      setCheckoutError('Please fill in all shipping detail fields');
      return;
    }
    
    const activeProvider = DEFAULT_LOGISTICS_PROVIDERS.find(p => p.id === selectedDeliveriId) || DEFAULT_LOGISTICS_PROVIDERS[0];
    let serverQuote: Awaited<ReturnType<typeof api.getOrderQuote>>;
    try {
      serverQuote = await api.getOrderQuote({
        items: cart.map(item => ({ productId: item.product.id, quantity: item.quantity })),
        state: location.state,
        logisticsProviderId: activeProvider.id,
        lastMileKm,
        deliveryUrgency,
      });
    } catch (err: any) {
      setCheckoutError(err.message || 'Could not validate your cart prices and delivery fee. Please refresh and try again.');
      return;
    }
    const totalWithFulfillment = serverQuote.total;
    const finalDeliveryCost = serverQuote.shippingCost;

    let paymentReference: string | undefined;
    let confirmedPaymentStatus: 'Pending' | 'Paid' = 'Pending';

    if (paymentMethod === 'wallet') {
      setCheckoutError('Wallet checkout is temporarily unavailable for live orders until TradeEase has a server-side wallet ledger. Please use Paystack card payment or bank transfer.');
      return;
    } else if (paymentMethod === 'bank') {
      if (!bankTransferRef.trim()) {
        setCheckoutError('Please input the Bank Transfer Transaction Ref (e.g. TXN-8392) for backoffice matching before submitting order.');
        return;
      }
      paymentReference = bankTransferRef.trim();
      confirmedPaymentStatus = 'Pending'; // awaiting backoffice reconciliation
    } else if (paymentMethod === 'card') {
      setCheckoutError('');
      setIsProcessingPayment(true);
      try {
        const buyerEmailForPaystack = currentUser ? currentUser.email : 'buyer@tradeease.com.ng';
        const reference = await openPaystackPopup(totalWithFulfillment, buyerEmailForPaystack);
        if (!reference) {
          setIsProcessingPayment(false);
          setCheckoutError('Payment was cancelled. Your card was not charged and no order was placed.');
          return;
        }
        const verification = await api.verifyPayment(reference, totalWithFulfillment);
        if (!verification.verified) {
          setIsProcessingPayment(false);
          setCheckoutError('We could not confirm this payment. If you were charged, contact support with reference ' + reference + '.');
          return;
        }
        paymentReference = verification.reference;
        confirmedPaymentStatus = 'Paid';
      } catch (err: any) {
        setIsProcessingPayment(false);
        setCheckoutError(err.message || 'Card payment failed. Please try again.');
        return;
      }
    }

    setCheckoutError('');

    const generatedTracking = `${activeProvider.code.toUpperCase()}-${Math.floor(100 + Math.random() * 899)}-${Math.floor(1000 + Math.random() * 8999)}`;

    try {
      await onPlaceOrder({
        buyerName: checkoutName,
        buyerPhone: checkoutPhone,
        state: location.state,
        city: location.city,
        address: checkoutAddress,
        shippingMethod: `${activeProvider.name} (${deliveryUrgency === 'economy' ? 'Standard' : deliveryUrgency === 'speedy' ? 'Swift Express' : 'Flash Sameday'} | ${getBaseStateDistanceKm(location.state) + lastMileKm} KM)`,
        shippingCost: finalDeliveryCost,
        logisticsProviderId: activeProvider.id,
        logisticsProviderName: activeProvider.name,
        trackingNumber: generatedTracking,
        carrierStatus: 'Dispatched to Carrier',
        paymentMethod,
        paymentStatus: confirmedPaymentStatus,
        paymentReference,
        lastMileKm,
        deliveryUrgency,
      });
      // Only deduct the wallet balance once the order has actually gone through.
      if (paymentMethod === 'wallet') {
        setWalletBalance((prev) => prev - totalWithFulfillment);
      }
      setIsProcessingPayment(false);
      setCheckoutStep('success');
    } catch (err: any) {
      setIsProcessingPayment(false);
      if (paymentMethod === 'card') {
        setCheckoutError(
          `Your card was charged (ref: ${paymentReference}) but we could not create the order. Please contact support with this reference — do not pay again.`
        );
      } else {
        setCheckoutError(err.message || 'Could not place your order. Please try again.');
      }
    }
  };

  const handleFinishSuccess = () => {
    onClearCart();
    setCheckoutStep('cart');
    setCheckoutName('');
    setCheckoutPhone('');
    setCheckoutAddress('');
    setNavTab('profile'); // Switch to profile order view
    setProfileSubTab('orders'); // Open our new dedicated Order History section
  };

  // Multi-format currency
  const formatNaira = (amt: number) => {
    return `₦${amt.toLocaleString()}`;
  };

  return (
    <div className="h-full flex flex-col justify-between bg-slate-50 dark:bg-slate-900 overflow-hidden relative">

      {/* Order Status Toasts Feed */}
      <div className="absolute top-16 left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {statusToasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="pointer-events-auto w-full bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border border-emerald-500/20 dark:border-emerald-500/10 p-3.5 rounded-2xl shadow-lg flex items-start gap-3 relative overflow-hidden cursor-pointer select-none"
              onClick={() => {
                setNavTab('profile');
                setProfileSubTab('orders');
                setCheckoutError(toast.orderId); // Set this order as the expanded one in the ledger
                setStatusToasts(prev => prev.filter(t => t.id !== toast.id));
              }}
            >
              {/* Highlight bar inside toast matching status */}
              <div className={`absolute top-0 left-0 bottom-0 w-1 ${
                toast.newStatus === 'Pending' ? 'bg-amber-500' :
                toast.newStatus === 'Processing' ? 'bg-blue-500' :
                toast.newStatus === 'Shipped' ? 'bg-purple-500' :
                toast.newStatus === 'Cancelled' ? 'bg-rose-500' :
                'bg-emerald-500'
              }`} />

              <div className="shrink-0 mt-0.5">
                {toast.newStatus === 'Pending' && <Bell className="w-4.5 h-4.5 text-amber-500" />}
                {toast.newStatus === 'Processing' && <Package className="w-4.5 h-4.5 text-blue-500" />}
                {toast.newStatus === 'Shipped' && <Truck className="w-4.5 h-4.5 text-purple-500" />}
                {toast.newStatus === 'Cancelled' && <X className="w-4.5 h-4.5 text-rose-500" />}
                {toast.newStatus === 'Delivered' && <Check className="w-4.5 h-4.5 text-emerald-500" />}
              </div>

              <div className="flex-1 min-w-0 pr-4">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-450 block font-sans">
                  {toast.title}
                </span>
                <p className="text-[11px] text-gray-750 dark:text-gray-300 font-bold mt-0.5 leading-snug">
                  {toast.msg}
                </p>
                <span className="text-[8.5px] font-mono text-gray-400 mt-1 block">
                  Tap to track Waybill {toast.orderId}
                </span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setStatusToasts(prev => prev.filter(t => t.id !== toast.id));
                }}
                className="absolute top-2 right-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-350 cursor-pointer border-none bg-transparent font-extrabold text-xs"
              >
                ✕
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Account settings toast (profile/password/2FA/verification feedback) */}
      <AnimatePresence>
        {accountToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`absolute top-16 left-4 right-4 z-50 p-3 rounded-2xl shadow-lg text-xs font-bold text-white ${
              accountToast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
            }`}
          >
            {accountToast.msg}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 1. App Header */}
      <header className="h-14 bg-white dark:bg-slate-950 px-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 z-10 shrink-0">
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="p-1 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex flex-col items-start select-none cursor-pointer" onClick={() => setNavTab('explore')}>
            <Logo size="sm" showTagline={false} animate={false} />
            <span className="text-[9px] text-gray-400 font-bold flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Buyer: {location.city}, {location.state}</span>
            </span>
          </div>
        </div>

        {/* Quick controls (Theme and micro-cart trigger) */}
        <div className="flex items-center gap-2">
          {/* Quick theme toggler in AppBar */}
          <button 
            onClick={onThemeToggle}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-amber-400 cursor-pointer rounded-lg"
          >
            {darkMode ? <Sparkles className="w-4 h-4 text-amber-400" /> : <Smartphone className="w-4 h-4" />}
          </button>

          <button 
            onClick={() => setNavTab('cart')}
            className="p-1.5 rounded-lg text-gray-700 dark:text-gray-300 relative hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <ShoppingCart className="w-5.5 h-5.5" />
            {cartItemsCount > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1.5 bg-red-500 text-white font-extrabold text-[8px] min-w-4 h-4 rounded-full flex items-center justify-center px-1 border border-white dark:border-slate-950 shadow-sm"
              >
                {cartItemsCount}
              </motion.span>
            )}
          </button>
        </div>
      </header>

      {/* 2. Side Panel Navigation Drawer Backdrop & Body */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="absolute inset-0 bg-black z-30"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="absolute top-0 bottom-0 left-0 w-4/5 max-w-[280px] bg-white dark:bg-slate-950 z-40 p-5 flex flex-col justify-between shadow-2xl"
            >
              <div className="space-y-6">
                {/* Drawer Branding Header */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex flex-col items-start gap-1">
                    <Logo size="sm" showTagline={false} animate={false} />
                  </div>
                  <button 
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Categories filtering links */}
                <div className="space-y-2">
                  <h4 className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider pl-1.5">
                    Shop Categories
                  </h4>
                  <div className="space-y-1">
                    <button
                      onClick={() => selectCategoryFilter('all')}
                      className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-between cursor-pointer ${
                        selectedCategory === 'all'
                          ? 'bg-emerald-600 text-white'
                          : 'hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span>All Products</span>
                      <span className="text-[10px] opacity-70">({products.length})</span>
                    </button>
                    {TRADEASE_CATALOG.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => selectCategoryFilter(cat.id)}
                        className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-between cursor-pointer ${
                          selectedCategory === cat.id
                            ? 'bg-emerald-600 text-white'
                            : 'hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {React.createElement(IconMap[cat.iconName] || Package, { className: "w-3.5 h-3.5 shrink-0" })}
                          <span>{cat.name}</span>
                        </div>
                        <span className="text-[10px] opacity-70">
                          ({products.filter(p => p.category === cat.id).length})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sub features navigation */}
                <div className="space-y-2">
                  <h4 className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider pl-1.5">
                    Quick Navigation
                  </h4>
                  <div className="space-y-1">
                    <button
                      onClick={() => { setNavTab('home'); setIsDrawerOpen(false); }}
                      className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 cursor-pointer ${
                        navTab === 'home'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Home className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Home Feed</span>
                    </button>
                    <button
                      onClick={() => { setNavTab('about'); setIsDrawerOpen(false); }}
                      className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 cursor-pointer ${
                        navTab === 'about'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Compass className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>About Us</span>
                    </button>
                    <button
                      onClick={() => { setNavTab('cart'); setIsDrawerOpen(false); }}
                      className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 cursor-pointer ${
                        navTab === 'cart'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <ShoppingCart className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Shopping Cart ({cartItemsCount})</span>
                    </button>
                    <button
                      onClick={() => { setNavTab('profile'); setIsDrawerOpen(false); }}
                      className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 cursor-pointer ${
                        navTab === 'profile'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {currentUser?.avatar ? (
                        <img src={currentUser.avatar} alt="Me" referrerPolicy="no-referrer" className="w-5 h-5 rounded-full object-cover border border-emerald-500 shrink-0" />
                      ) : currentUser ? (
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[7px] font-black shrink-0">{(currentUser.name || 'M').trim().charAt(0).toUpperCase()}</span>
                      ) : (
                        <User className="w-4 h-4 text-emerald-500 shrink-0" />
                      )}
                      <span>Me</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Sell on TradeEase */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => { setNavTab('sell'); setIsDrawerOpen(false); }}
                  className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Sell on TradeEase</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 3. Main Workspace Area (Toggles based on NavTab) */}
      <div className="flex-1 overflow-y-auto min-h-0 relative">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: HOME FEED */}
          {navTab === 'home' && (
            <motion.div
              key="buyer-home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-5 pb-8"
            >
              {/* Swipeable Campaign Banners (Jumia Style Carousel) */}
              <div className="relative mx-4 mt-3 rounded-2xl overflow-hidden shadow-md group">
                <AnimatePresence mode="wait">
                  {BANNER_CAMPAIGNS.map((banner, index) => {
                    if (index !== activePromoIndex) return null;
                    return (
                      <motion.div
                        key={`banner-${banner.id}`}
                        initial={{ opacity: 0, x: 25 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -25 }}
                        transition={{ duration: 0.35 }}
                        className={`p-4 bg-gradient-to-r ${banner.color} text-white flex flex-col justify-between h-34 min-h-[136px] relative overflow-hidden`}
                      >
                        {/* Decorative background image overlay */}
                        <div className="absolute inset-0 opacity-15 mix-blend-overlay">
                          <img
                            src={banner.image}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Background embellishments */}
                        <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-white/10 rounded-full blur-sm" />
                        <div className="absolute -top-8 -left-8 w-20 h-20 bg-white/10 rounded-full blur-sm" />

                        <div className="relative z-10 space-y-1">
                          <span className="text-[8px] bg-white/20 text-white px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold">
                            {banner.badge}
                          </span>
                          <h3 className="text-sm font-black leading-tight pt-1">{banner.title}</h3>
                          <p className="text-[10px] text-white/80 leading-snug max-w-[85%] font-medium">
                            {banner.tagline}
                          </p>
                        </div>

                        <div className="relative z-10 flex items-center justify-between mt-1">
                          <button
                            onClick={() => {
                              if (banner.id === 1) {
                                selectCategoryFilter('all');
                              } else if (banner.id === 3) {
                                setNavTab('profile');
                                setProfileSubTab('wallet');
                              }
                            }}
                            className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-900 font-extrabold text-[9px] rounded-lg shadow-sm transition-colors uppercase tracking-wide cursor-pointer"
                          >
                            {banner.actionLabel}
                          </button>
                          
                          <span className="text-[8.5px] text-white/50 font-mono">
                            TradeEase Guaranteed
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* Left navigation arrow */}
                <button
                  onClick={() => setActivePromoIndex((prev) => (prev - 1 + BANNER_CAMPAIGNS.length) % BANNER_CAMPAIGNS.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-xs flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10 hover:bg-black/60"
                >
                  <ChevronLeft className="w-4.5 h-4.5" />
                </button>

                {/* Right navigation arrow */}
                <button
                  onClick={() => setActivePromoIndex((prev) => (prev + 1) % BANNER_CAMPAIGNS.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-xs flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10 hover:bg-black/60"
                >
                  <ChevronRight className="w-4.5 h-4.5" />
                </button>

                {/* Indicator dots */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                  {BANNER_CAMPAIGNS.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActivePromoIndex(idx)}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        idx === activePromoIndex ? 'bg-white w-3' : 'bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              </div>


              {/* Jumia Featured Official Vendors List */}
              <div className="space-y-2">
                <div className="px-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-black bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded-md font-mono">
                      Stores
                    </span>
                    <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
                      Featured Brand Vendors
                    </h3>
                  </div>
                  {selectedVendorId && (
                    <button
                      onClick={() => setSelectedVendorId(null)}
                      className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider"
                    >
                      Clear Store Filter
                    </button>
                  )}
                </div>

                <div className="flex gap-3 overflow-x-auto px-4 pb-1.5 scrollbar-none">
                  {FEATURED_VENDORS.map((v) => {
                    const isSelected = selectedVendorId === v.id;
                    return (
                      <button
                        key={v.id}
                        onClick={() => {
                          setSelectedVendorId(isSelected ? null : v.id);
                          if (selectedCategory !== 'all') {
                            setSelectedCategory('all');
                          }
                        }}
                        className={`flex flex-col items-center text-center shrink-0 p-2.5 rounded-2xl border transition-all cursor-pointer w-[105px] ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 shadow-xs'
                            : 'bg-white dark:bg-slate-950 border-gray-150 dark:border-gray-800'
                        }`}
                      >
                        {/* Avatar */}
                        <div className="relative mb-1.5">
                          <div className={`w-11 h-11 rounded-full ${isSelected ? 'ring-2 ring-emerald-500' : 'ring-1 ring-gray-200 dark:ring-gray-700/60'} ${v.logoColor} text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0`}>
                            {v.initials}
                          </div>
                          {v.verified && (
                            <span className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 text-white p-0.5 rounded-full border border-white dark:border-slate-950 flex items-center justify-center shadow-xs">
                              <Check className="w-2.5 h-2.5 stroke-[4.5]" />
                            </span>
                          )}
                        </div>

                        {/* Name and Rating */}
                        <span className="text-[10.5px] font-extrabold text-gray-900 dark:text-white leading-tight line-clamp-1 truncate w-full">
                          {v.name}
                        </span>
                        
                        <span className="text-[8px] text-gray-400 mt-0.5 font-medium line-clamp-1 truncate w-full">
                          {v.category}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Vendor Active Filtering Feedback Banner */}
              {selectedVendorId && (
                <div className="mx-4 p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between text-xs animate-pulse">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-emerald-800 dark:text-emerald-400">
                      Browsing official catalog from <span className="underline font-black">{FEATURED_VENDORS.find(v => v.id === selectedVendorId)?.name}</span>
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedVendorId(null)}
                    className="text-[9px] bg-red-500/10 text-red-600 dark:text-red-400 px-2.5 py-1 rounded-md font-extrabold uppercase hover:bg-red-500/20 cursor-pointer"
                  >
                    Remove Filter
                  </button>
                </div>
              )}

              {/* Quick Horizontal Scroll of categories quick filters */}
              <div className="space-y-2">
                <div className="px-4 flex items-center justify-between gap-3">
                  <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">Categories</h3>
                  <select value={selectedCategory} onChange={(e) => { selectCategoryFilter(e.target.value); setNavTab('home'); }} className="max-w-[190px] bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 rounded-lg px-2 py-1.5 text-[10px] font-bold text-gray-700 dark:text-gray-200">
                    <option value="all">Browse all categories</option>
                    {TRADEASE_CATALOG.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
                <div className="flex gap-2.5 overflow-x-auto px-4 pb-2 scrollbar-none">
                  {/* All badge option */}
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                      selectedCategory === 'all'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-950 border border-gray-150 dark:border-gray-800 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    All Items
                  </button>
                  {TRADEASE_CATALOG.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
                        selectedCategory === cat.id
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-950 border border-gray-150 dark:border-gray-800 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {React.createElement(IconMap[cat.iconName] || Package, { className: "w-3.5 h-3.5" })}
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {selectedCategory !== 'all' && CATALOG_BY_ID[selectedCategory] && (
                <div className="px-4 pb-3">
                  <select value={selectedSubcategory} onChange={(e) => setSelectedSubcategory(e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-200">
                    <option value="all">All {CATALOG_BY_ID[selectedCategory].name}</option>
                    {CATALOG_BY_ID[selectedCategory].subcategories.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
                  </select>
                  <div className="flex gap-2 overflow-x-auto mt-2 scrollbar-none">
                    {CATALOG_BY_ID[selectedCategory].subcategories.map(sub => <button key={sub.id} onClick={() => setSelectedSubcategory(sub.id)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold shrink-0 border ${selectedSubcategory===sub.id?'bg-emerald-600 text-white border-emerald-600':'bg-white dark:bg-slate-950 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300'}`}>{sub.name}</button>)}
                  </div>
                </div>
              )}

              {/* Slider for Featured Products */}
              {selectedCategory === 'all' && featuredProducts.length > 0 && (
                <div className="space-y-2">
                  <div className="px-4">
                    <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
                      Featured Campaigns
                    </h3>
                  </div>
                  
                  <div className="flex gap-3 overflow-x-auto px-4 pb-3 scrollbar-none scroll-smooth">
                    {featuredProducts.map((prod) => {
                      const discountPercentage = Math.round(((prod.originalPrice - prod.price) / prod.originalPrice) * 100);
                      return (
                        <div
                          key={`feat-${prod.id}`}
                          onClick={() => setSelectedProduct(prod)}
                          className="w-[260px] bg-white dark:bg-slate-950 border border-gray-150 dark:border-gray-800/80 rounded-2xl p-2.5 shrink-0 hover:shadow-md transition-shadow relative cursor-pointer"
                        >
                          <div className="w-full h-28 bg-gray-100 rounded-xl overflow-hidden relative">
                            {/* Discount Tag */}
                            {discountPercentage > 0 && (
                              <span className="absolute top-2 left-2 z-10 bg-amber-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-lg shadow-sm">
                                SAVE {discountPercentage}%
                              </span>
                            )}
                            <img
                              src={prod.image}
                              alt={prod.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                            {/* Star Badge */}
                            <div className="absolute bottom-2 left-2 bg-slate-900/70 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                              {prod.reviewsCount > 0 ? (
                                <>
                                  <Star className="w-2.5 h-2.5 fill-amber-400 stroke-amber-400" />
                                  <span>{prod.rating}</span>
                                </>
                              ) : (
                                <span className="text-emerald-400">New</span>
                              )}
                            </div>
                          </div>

                          <div className="mt-2.5 space-y-1">
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">
                              Vendor: {prod.vendorName}
                            </span>
                            <h4 className="text-xs font-bold text-gray-800 dark:text-gray-100 line-clamp-1">
                              {prod.title}
                            </h4>
                            <div className="flex items-center gap-2 pt-0.5">
                              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                                {formatNaira(prod.price)}
                              </span>
                              <span className="text-[10px] text-gray-400 line-through">
                                {formatNaira(prod.originalPrice)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Main Product Catalog Grid */}
              <div className="space-y-3 px-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
                    {selectedCategory === 'all' ? "Trending Items" : `${selectedCategory} Products`}
                  </h3>
                  <span className="text-[10px] text-gray-400 font-bold">
                    {filteredProducts.length} items found
                  </span>
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="text-center py-10 bg-white dark:bg-slate-950 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                    <Package className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
                    <p className="text-xs font-medium text-gray-400 dark:text-gray-500">
                      No stock active for this category currently.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 pb-4">
                    {filteredProducts.map((prod) => (
                      <div
                        key={`grid-${prod.id}`}
                        className="bg-white dark:bg-slate-950 border border-gray-150 dark:border-gray-800/80 rounded-2xl p-2.5 flex flex-col justify-between"
                      >
                        {/* Img Trigger for custom modal view */}
                        <div className="cursor-pointer" onClick={() => setSelectedProduct(prod)}>
                          <div className="w-full h-24 bg-gray-50 rounded-xl overflow-hidden relative">
                            <img
                              src={prod.image}
                              alt={prod.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                            {/* Absolute category badge */}
                            <span className="absolute top-1.5 right-1.5 text-[8px] bg-slate-900/60 backdrop-blur-xs text-white font-bold px-1.5 py-0.5 rounded-md uppercase">
                              {prod.category}
                            </span>
                          </div>

                          <div className="mt-2 space-y-0.5 text-left">
                            <h4 className="text-xs font-bold text-gray-800 dark:text-gray-100 line-clamp-1 leading-snug">
                              {prod.title}
                            </h4>
                            <span className="text-[9px] text-gray-400 font-medium block">
                              By {prod.vendorName}
                            </span>
                          </div>
                        </div>

                        {/* Order & Card footer */}
                        <div className="mt-2.5 pt-1.5 border-t border-gray-100 dark:border-gray-900 flex items-center justify-between">
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                            {formatNaira(prod.price)}
                          </span>

                          <button
                            onClick={() => onAddToCart(prod)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white p-1.5 rounded-lg shadow-sm transition-transform active:scale-90 cursor-pointer"
                            title="Add to Cart"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* About Us Description Card */}
                <div className="mt-6 bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-left">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs">
                    <Logo size="sm" showText={false} animate={false} />
                    <span>About TradeEase</span>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    TradeEase is a multi-vendor marketplace for buying and selling products and services, with integrated payment and delivery options.
                  </p>
                  <button onClick={() => setNavTab('about')} className="mt-3 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    Learn more →
                  </button>
                </div>

              </div>
            </motion.div>
          )}

          {/* TAB 5: ABOUT US FEED */}
          {navTab === 'about' && (
            <motion.div
              key="buyer-about-us"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 space-y-5 pb-20 text-left"
            >
              <div className="bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
                <Logo size="md" showText={true} animate={false} />
                <h1 className="mt-5 text-2xl font-black text-gray-900 dark:text-white tracking-tight">About Us</h1>
                <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                  TradeEase is a multi-vendor marketplace that connects customers with independent vendors selling products and services.
                </p>
                <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                  Buyers can browse products, place orders and make payments in one app. Vendors can list products, manage orders and operate their stores from the same platform.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
                  <h2 className="text-sm font-black text-gray-900 dark:text-white">What we do</h2>
                  <p className="mt-1.5 text-xs leading-5 text-gray-600 dark:text-gray-400">
                    We provide the marketplace, account, ordering, payment and vendor tools needed to support online commerce.
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
                  <h2 className="text-sm font-black text-gray-900 dark:text-white">Payments & delivery</h2>
                  <p className="mt-1.5 text-xs leading-5 text-gray-600 dark:text-gray-400">
                    Payments are processed through integrated payment providers. Delivery may be handled by DELIVERI, TradeEase's owned logistics service, or other logistics providers integrated with the platform.
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
                  <h2 className="text-sm font-black text-gray-900 dark:text-white">For buyers and vendors</h2>
                  <p className="mt-1.5 text-xs leading-5 text-gray-600 dark:text-gray-400">
                    One TradeEase account can support both buying and selling, subject to the account and vendor requirements that apply to each activity.
                  </p>
                </div>
              </div>

              <div className="bg-emerald-950 dark:bg-emerald-950 rounded-2xl p-5 text-white">
                <h2 className="text-sm font-black">Our approach</h2>
                <p className="mt-1.5 text-xs leading-5 text-emerald-50/80">
                  We aim to make online buying and selling straightforward while providing the tools needed to manage products, orders, payments and delivery.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
                <h2 className="text-sm font-black text-gray-900 dark:text-white">Contact</h2>
                <div className="mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <p>Support: support@tradease.ng</p>
                  <p>Privacy: privacy@tradease.ng</p>
                  <p>Website: tradease.ng</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB: SELL ON TRADEEASE */}
          {navTab === 'sell' && (
            <motion.div key="sell-on-tradease" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 space-y-5 pb-20 text-left">
              <div className="rounded-2xl overflow-hidden bg-emerald-950 text-white p-6 relative">
                <div className="absolute -right-10 -top-10 w-36 h-36 rounded-full bg-lime-400/10" />
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-lime-300">Sell on TradeEase</p>
                <h1 className="mt-2 text-2xl font-black leading-tight">Turn your products into online sales.</h1>
                <p className="mt-3 text-sm leading-6 text-emerald-50/80 max-w-md">List your products, reach buyers, receive payments and manage orders from one marketplace.</p>
                <button onClick={() => onTriggerLogin('vendor', 'signup')} className="mt-5 px-5 py-3 bg-lime-500 hover:bg-lime-400 text-slate-950 rounded-xl font-black text-sm cursor-pointer">Create a Seller Account</button>
              </div>

              <div>
                <h2 className="text-lg font-black text-gray-900 dark:text-white">Why sell on TradeEase?</h2>
                <div className="mt-3 grid grid-cols-1 gap-3">
                  {[
                    ['Reach more buyers','Put your products in front of customers browsing across TradeEase.'],
                    ['Manage your store','Add products, update stock and manage your listings from your seller account.'],
                    ['Secure payments','Receive order payments through TradeEase payment flows with transaction records.'],
                    ['Delivery options','Use TradeEase-integrated logistics providers, including DELIVERI where available.'],
                  ].map(([title, text]) => (
                    <div key={title} className="p-4 bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 rounded-xl flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0"><Check className="w-4 h-4" /></div>
                      <div><h3 className="text-sm font-black text-gray-900 dark:text-white">{title}</h3><p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">{text}</p></div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-black text-gray-900 dark:text-white">How It Works</h2>
                <div className="mt-3 space-y-3">
                  {[
                    ['1','Create your seller account','Choose Vendor during sign-up and provide your basic account details.'],
                    ['2','Set up your store','Complete the required store information and seller verification steps.'],
                    ['3','Add your products','Choose a category and subcategory, add product details, price, stock and images, then publish your listings.'],
                    ['4','Receive and process orders','When customers order, view the order in your seller dashboard, prepare the items and update the fulfilment status.'],
                    ['5','Delivery and payment','A suitable integrated logistics provider handles delivery. Order and payment records remain available in your TradeEase account.'],
                  ].map(([n,title,text]) => (
                    <div key={n} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0">{n}</div>
                      <div><h3 className="text-sm font-black text-gray-900 dark:text-white">{title}</h3><p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">{text}</p></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 text-center">
                <h2 className="text-base font-black text-gray-900 dark:text-white">Ready to start selling?</h2>
                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">Create your seller account and start setting up your store.</p>
                <button onClick={() => onTriggerLogin('vendor', 'signup')} className="mt-4 w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-sm cursor-pointer">Sign Up to Sell</button>
              </div>
            </motion.div>
          )}

          {/* TAB 2: CATEGORIES SCREEN */}
          {navTab === 'categories' && (
            <motion.div
              key="buyer-cats"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 space-y-4"
            >
              <h2 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">
                Market Departments
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => selectCategoryFilter('all')}
                  className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 hover:from-emerald-500/35 border border-emerald-500/20 text-slate-800 dark:text-white font-black text-xs text-left flex flex-col justify-between h-28 cursor-pointer shadow-xs"
                >
                  <Package className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <span className="block text-sm">Full Catalog</span>
                    <span className="text-[9px] text-gray-400 font-medium block">Browse all products</span>
                  </div>
                </button>

                {TRADEASE_CATALOG.map((cat) => (
                  <button
                    key={`department-${cat.id}`}
                    onClick={() => selectCategoryFilter(cat.id)}
                    className={`p-4 rounded-2xl border text-slate-800 dark:text-white font-black text-xs text-left flex flex-col justify-between h-28 cursor-pointer shadow-xs ${cat.color} border-current/10 hover:brightness-95`}
                  >
                    {React.createElement(IconMap[cat.iconName] || Package, { className: "w-7 h-7 shrink-0" })}
                    <div>
                      <span className="block text-sm">{cat.name}</span>
                      <span className="text-[9px] opacity-75 font-medium block">
                        {products.filter(p => p.category === cat.id).length} items listed
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB 3: CART & CHECKOUT ENGINE */}
          {navTab === 'cart' && (
            <motion.div
              key="buyer-cart"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 h-full flex flex-col justify-between"
            >
              {checkoutStep === 'cart' && (
                <div className="flex-1 flex flex-col justify-between h-full">
                  <div className="space-y-4 overflow-y-auto max-h-[500px]">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">
                        Your Order Bag
                      </h2>
                      {cart.length > 0 && (
                        <button 
                          onClick={onClearCart}
                          className="text-[10px] font-bold text-red-500 flex items-center gap-1 uppercase hover:underline"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Empty</span>
                        </button>
                      )}
                    </div>

                    {cart.length === 0 ? (
                      <div className="text-center py-16 space-y-3">
                        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-gray-400">
                          <ShoppingCart className="w-8 h-8" />
                        </div>
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white">Your Cart is Empty</h4>
                        <p className="text-xs text-gray-400 dark:text-gray-500 max-w-xs mx-auto">
                          Check out the home tab and add some premium Infinix phones or classic Agbada sets to your basket!
                        </p>
                        <button
                          onClick={() => setNavTab('home')}
                          className="mt-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold"
                        >
                          Shop Now
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {cart.map((item) => (
                          <div
                            key={`cart-${item.product.id}`}
                            className="p-2.5 bg-white dark:bg-slate-950 border border-gray-150 dark:border-gray-800 rounded-xl flex items-center gap-3"
                          >
                            <img
                              src={item.product.image}
                              alt={item.product.title}
                              referrerPolicy="no-referrer"
                              className="w-11 h-11 rounded-lg object-cover bg-gray-50 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-gray-800 dark:text-gray-100 truncate">
                                {item.product.title}
                              </h4>
                              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold mt-0.5">
                                {formatNaira(item.product.price)}
                              </p>
                            </div>

                            {/* Adjust Counter */}
                            <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-900 py-1 px-1.5 rounded-lg border border-gray-150 dark:border-gray-800">
                              <button
                                onClick={() => onUpdateCartQuantity(item.product.id, item.quantity - 1)}
                                className="p-0.5 text-gray-500 hover:text-gray-800 cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-[11px] font-bold min-w-[14px] text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => onUpdateCartQuantity(item.product.id, item.quantity + 1)}
                                className="p-0.5 text-gray-500 hover:text-gray-800 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <button
                              onClick={() => onRemoveFromCart(item.product.id)}
                              className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Summary Details Panel at bottom */}
                  {cart.length > 0 && (
                    <div className="border-t border-gray-100 dark:border-gray-800 pt-3 bg-slate-50 dark:bg-slate-900 mt-4 space-y-3 shrink-0">
                      <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-gray-150 dark:border-gray-800 space-y-2">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Items Total:</span>
                          <span className="font-semibold text-gray-700 dark:text-slate-300">{formatNaira(cartTotalAmount)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Payment Processing Fee:</span>
                          <span className="font-semibold text-emerald-600">FREE</span>
                        </div>
                        <div className="border-t border-gray-100 dark:border-gray-850 pt-1.5 flex items-center justify-between text-sm">
                          <span className="font-extrabold">Grand Total:</span>
                          <span className="font-black text-emerald-600 dark:text-emerald-400">{formatNaira(cartTotalAmount)}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (!currentUser) {
                            onTriggerLogin();
                            return;
                          }
                          setCheckoutStep('shipping');
                        }}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-extrabold text-xs tracking-wider uppercase shadow-md flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-[0.99]"
                      >
                        <span>{currentUser ? 'Secure Checkout' : 'Sign In to Checkout'}</span>
                        <span>({formatNaira(cartTotalAmount)})</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Checkout step 2: Shipping details */}
              {checkoutStep === 'shipping' && (
                <form onSubmit={handleCheckoutSubmit} className="flex-1 flex flex-col justify-between h-full text-left">
                  <div className="space-y-4 overflow-y-auto max-h-[500px]">
                    <div className="flex items-center gap-1.5 pb-2 border-b border-gray-100 dark:border-gray-850">
                      <button 
                        type="button"
                        onClick={() => setCheckoutStep('cart')}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-emerald-600"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <h2 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">
                        Safe Checkout
                      </h2>
                    </div>

                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-[11px] text-emerald-800 dark:text-emerald-400 rounded-xl space-y-1 block border border-emerald-500/10">
                      <div className="flex items-center gap-1.5 font-bold">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Secure Paystack Checkout</span>
                      </div>
                      <p className="font-normal opacity-90 leading-normal">
                        Your payment is processed securely through Paystack. TradeEase verifies the payment before the order is confirmed.
                      </p>
                    </div>

                    {checkoutError && (
                      <p className="text-xs font-bold text-red-500 bg-red-100 dark:bg-red-950/30 p-2 rounded-lg">
                        {checkoutError}
                      </p>
                    )}

                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1">
                          Consignee Name
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Adebayo Babajide"
                          value={checkoutName}
                          onChange={(e) => setCheckoutName(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 rounded-xl px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-emerald-500 hover:border-gray-300 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1">
                          Phone Contacts
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="e.g. +234 803 XXXXXXX"
                          value={checkoutPhone}
                          onChange={(e) => setCheckoutPhone(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 rounded-xl px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-emerald-500 hover:border-gray-300 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1">
                          Delivery City & state
                        </label>
                        <div className="p-3 bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold select-none text-gray-650 flex gap-2">
                          <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{location.city}, {location.state} State (Nigeria Hub)</span>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1">
                          Street Address Details
                        </label>
                        <textarea
                          placeholder="Plot number, house number, apartment name and local street detail"
                          required
                          rows={2}
                          value={checkoutAddress}
                          onChange={(e) => setCheckoutAddress(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 rounded-xl px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-emerald-500 hover:border-gray-300 dark:text-white"
                        />
                      </div>

      {/* Logistics Companies & Carrier Selector */}
                      <div className="pt-2 pb-2 space-y-3 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest block font-black">
                            Select Logistics Carrier (Multi-Carrier API & Webhook Integration)
                          </label>
                          <span className="text-[8px] bg-blue-500/10 text-blue-600 dark:text-blue-400 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-widest font-mono border border-blue-500/10">
                            {DEFAULT_LOGISTICS_PROVIDERS.length} Carriers Connected
                          </span>
                        </div>

                        {/* PART 1: CHOOSE BASE FULFILLMENT PATHWAY */}
                        <div className="grid grid-cols-2 gap-2">
                          {DEFAULT_LOGISTICS_PROVIDERS.map((opt) => {
                            const isSelected = selectedDeliveriId === opt.id;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => setSelectedDeliveriId(opt.id)}
                                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between relative overflow-hidden ${
                                  isSelected
                                    ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-500 text-blue-900 dark:text-blue-300 shadow-xs ring-1 ring-blue-500/20'
                                    : 'bg-white dark:bg-slate-950 border-gray-200 dark:border-gray-800 hover:border-gray-300'
                                }`}
                              >
                                <div className="space-y-1 w-full">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-tight truncate text-gray-900 dark:text-white">
                                      {opt.name}
                                    </span>
                                    <span className="text-[7px] bg-blue-500/10 text-blue-600 dark:text-blue-400 font-extrabold px-1.5 py-0.2 rounded font-mono uppercase shrink-0">
                                      {opt.type.replace('_and_', ' & ')}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[7.5px] bg-gray-500/10 text-gray-600 dark:text-gray-400 font-bold px-1.5 py-0.2 rounded font-mono">
                                      ⏱️ {opt.estimatedDays}
                                    </span>
                                    <span className="text-[7.5px] text-amber-500 font-extrabold flex items-center gap-0.5">
                                      ★ {opt.rating}
                                    </span>
                                  </div>

                                  <p className="text-[8px] text-gray-400 dark:text-gray-500 line-clamp-1 mt-0.5 leading-tight">
                                    {opt.description}
                                  </p>
                                </div>

                                <div className="mt-2 pt-1.5 border-t border-gray-100 dark:border-gray-850/80 flex items-center justify-between">
                                  <span className="text-[8px] font-extrabold text-gray-400 uppercase">Base Rate</span>
                                  <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 font-mono">
                                    ₦{opt.baseFee.toLocaleString()}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {/* PART 2: THE INTERACTIVE FEE CALCULATOR FOR DISTANCE, WEIGHT & URGENCY */}
                        <div className="bg-slate-50 dark:bg-slate-950/40 p-3.5 rounded-2xl border border-gray-200/60 dark:border-gray-800 space-y-3 text-[11px]">
                          {/* 2a. DISTANCE PARAMETER */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] uppercase font-extrabold text-gray-500 tracking-wider">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-blue-500" />
                                1. Distance Route Surcharge
                              </span>
                              <span className="font-mono text-blue-600 dark:text-blue-400">
                                ₦{((getBaseStateDistanceKm(location.state) + lastMileKm) * 15).toLocaleString()}
                              </span>
                            </div>
                            <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-gray-150 dark:border-gray-850 space-y-1 text-left">
                              <div className="flex justify-between items-center text-[9.5px] text-gray-650 dark:text-gray-300 font-semibold">
                                <span>Freight from Central Lagos Hub:</span>
                                <span className="font-mono font-black text-gray-900 dark:text-white">
                                  {getBaseStateDistanceKm(location.state)} KM
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-[9.5px] text-gray-650 dark:text-gray-300 font-semibold gap-3">
                                <span>Adjust Last-Mile Dispatch:</span>
                                <span className="font-mono font-black text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded shrink-0">
                                  +{lastMileKm} KM connection
                                </span>
                              </div>
                              <input
                                type="range"
                                min="2"
                                max="45"
                                value={lastMileKm}
                                onChange={(e) => setLastMileKm(Number(e.target.value))}
                                className="w-full h-1.5 bg-gray-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 mt-1"
                              />
                              <span className="text-[8px] text-gray-400 block font-normal leading-none mt-1">
                                Drag slider to estimate distance from your {location.state} local central bus terminus.
                              </span>
                            </div>
                          </div>

                          {/* 2b. WEIGHT PARAMETER */}
                          <div className="space-y-1.5">
                            {(() => {
                              const totalWeightKg = cart.reduce((sum, item) => {
                                const w = getProductEstimatedWeight(item.product.category, item.product.title);
                                return sum + (item.quantity * w);
                              }, 0);
                              return (
                                <>
                                  <div className="flex justify-between text-[10px] uppercase font-extrabold text-gray-500 tracking-wider">
                                    <span className="flex items-center gap-1">
                                      <Package className="w-3.5 h-3.5 text-emerald-500" />
                                      2. Cumulative Weight Factor
                                    </span>
                                    <span className="font-mono text-emerald-600 dark:text-emerald-450">
                                      ₦{(totalWeightKg * 300).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-gray-150 dark:border-gray-850 space-y-1 text-left">
                                    <div className="flex justify-between items-center text-[9.5px] text-gray-650 dark:text-gray-300 font-semibold">
                                      <span>Total Cart Cargo Payload:</span>
                                      <span className="font-mono font-black text-gray-900 dark:text-white">
                                        {totalWeightKg.toFixed(1)} KG
                                      </span>
                                    </div>
                                    <div className="text-[8px] text-gray-450 dark:text-gray-400 space-y-0.5 pt-0.5 border-t border-gray-100 dark:border-gray-800">
                                      {cart.map((item, idx) => {
                                        const unitW = getProductEstimatedWeight(item.product.category, item.product.title);
                                        return (
                                          <div key={idx} className="flex justify-between font-normal text-gray-500">
                                            <span className="truncate max-w-[190px]">{item.product.title} (x{item.quantity})</span>
                                            <span className="font-mono whitespace-nowrap">
                                              {unitW === 0 ? "0.0 KG (Waived)" : `${(unitW * item.quantity).toFixed(1)} KG`}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </>
                              );
                            })()}
                          </div>

                          {/* 2c. URGENCY SPEED PARAMETER */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] uppercase font-extrabold text-gray-500 tracking-wider">
                              <span className="flex items-center gap-1">
                                <Truck className="w-3.5 h-3.5 text-amber-500" />
                                3. Shipment Urgency Tier
                              </span>
                              <span className="font-mono text-amber-600 dark:text-amber-400 font-extrabold">
                                ₦{(deliveryUrgency === 'economy' ? 0 : deliveryUrgency === 'speedy' ? 1800 : 4500).toLocaleString()}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-1">
                              {[
                                { id: 'economy', label: 'Economy Slower', fee: '+₦0', desc: '3-5 Days' },
                                { id: 'speedy', label: 'Swift Express', fee: '+₦1.8k', desc: 'Next-Day' },
                                { id: 'flash', label: 'Flash Instant', fee: '+₦4.5k', desc: 'Same-Day' }
                              ].map((tier) => {
                                const active = deliveryUrgency === tier.id;
                                return (
                                  <button
                                    key={tier.id}
                                    type="button"
                                    onClick={() => setDeliveryUrgency(tier.id as any)}
                                    className={`p-1.5 rounded-xl border text-center cursor-pointer transition-all flex flex-col justify-center ${
                                      active
                                        ? 'bg-amber-500 border-amber-400 text-slate-950 font-extrabold scale-102 shadow-xs'
                                        : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-800 hover:bg-gray-50 text-gray-600 dark:text-gray-300'
                                    }`}
                                  >
                                    <span className="text-[8.5px] font-black uppercase leading-tight tracking-tight block">{tier.label}</span>
                                    <span className="text-[7.5px] opacity-90 block tracking-tight font-mono">{tier.fee} | {tier.desc}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                        </div>
                      </div>

                      {/* Payment Mode Selector - satisfying Item 14 */}
                      <div className="pt-3 pb-1 space-y-2 border-t border-gray-100 dark:border-gray-800">
                        <label className="text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                          Select Direct Payment Gateway
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('wallet')}
                            className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                              paymentMethod === 'wallet'
                                ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-500 text-amber-600'
                                : 'bg-white dark:bg-slate-950 border-gray-200 dark:border-gray-800 text-gray-505 hover:bg-gray-50'
                            }`}
                          >
                            <Wallet className="w-4 h-4 shrink-0" />
                            <span className="text-[9px] font-black uppercase tracking-tight">Wallet</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setPaymentMethod('bank')}
                            className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                              paymentMethod === 'bank'
                                ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-500 text-amber-600'
                                : 'bg-white dark:bg-slate-950 border-gray-200 dark:border-gray-800 text-gray-505 hover:bg-gray-50'
                            }`}
                          >
                            <Building2 className="w-4 h-4 shrink-0" />
                            <span className="text-[9px] font-black uppercase tracking-tight">Bank Transfer</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setPaymentMethod('card')}
                            className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                              paymentMethod === 'card'
                                ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-500 text-amber-600'
                                : 'bg-white dark:bg-slate-950 border-gray-200 dark:border-gray-800 text-gray-505 hover:bg-gray-50'
                            }`}
                          >
                            <CreditCard className="w-4 h-4 shrink-0" />
                            <span className="text-[9px] font-black uppercase tracking-tight">Debit Card</span>
                          </button>
                        </div>
                      </div>

                      {/* Bank Transfer sandbox info */}
                      {paymentMethod === 'bank' && (
                        <div className="p-3 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-500/20 rounded-xl space-y-1.5 text-left">
                          <span className="text-[9px] bg-amber-500 text-slate-950 text-center uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded">
                            Direct Bank Transfer Info
                          </span>
                          <div className="space-y-0.5 font-mono text-[10px] text-gray-600 dark:text-gray-300">
                            <p>Bank: <strong className="text-gray-900 dark:text-white">Providus Bank PLC</strong></p>
                            <p>Account No: <strong className="text-gray-900 dark:text-white">1029831720</strong></p>
                            <p>Account Name: <strong className="text-gray-900 dark:text-white">TradeEase Nigeria Ltd</strong></p>
                            <p className="text-[9px] text-amber-600 dark:text-amber-400 font-sans mt-1">
                              *Instruction: Transfer exact total amount to the account above via your bank app, then input the transaction reference below.
                            </p>
                          </div>
                          <div>
                            <input
                              type="text"
                              value={bankTransferRef}
                              onChange={(e) => setBankTransferRef(e.target.value)}
                              placeholder="e.g. TXN9201830219"
                              className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-850 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                            />
                          </div>
                        </div>
                      )}

                      {/* Paystack / Credit card info */}
                      {paymentMethod === 'card' && (
                        <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-500/20 rounded-xl text-left space-y-1">
                          <span className="text-[9px] bg-emerald-600 text-white uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded">
                            Paystack Secure Checkout
                          </span>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">
                            You'll be prompted for your card details in a secure Paystack popup. Your card details never touch TradeEase's own servers.
                          </p>
                        </div>
                      )}

                    </div>
                  </div>

                  {/* Submission and summary */}
                  <div className="pt-4 border-t border-gray-100 dark:border-gray-800 shrink-0 space-y-2.5">
                    <div className="p-3 bg-slate-100 dark:bg-slate-950/60 rounded-xl space-y-1.5 text-xs text-gray-650 dark:text-gray-400 border border-gray-100 dark:border-white/5">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-500">Items:</span>
                        <span className="font-mono text-gray-900 dark:text-gray-200 font-bold">{formatNaira(cartTotalAmount)}</span>
                      </div>
                      <div className="flex flex-col space-y-0.5 pt-0.5 border-b border-gray-250/20 pb-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-500">Delivery Fee:</span>
                          <span className="font-mono text-sky-600 dark:text-sky-450 font-bold">
                            +{formatNaira(getDynamicDeliveriCost((DEFAULT_LOGISTICS_PROVIDERS.find(o => o.id === selectedDeliveriId) || DEFAULT_LOGISTICS_PROVIDERS[0]).baseFee))}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-gray-450 pl-2">
                          <span>• Weight Fee ({cart.reduce((sum, item) => sum + item.quantity * getProductEstimatedWeight(item.product.category, item.product.title), 0).toFixed(1)} KG):</span>
                          <span>+{formatNaira(Math.round(cart.reduce((sum, item) => sum + item.quantity * getProductEstimatedWeight(item.product.category, item.product.title), 0) * 300))}</span>
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-gray-450 pl-2">
                          <span>• Distance Fee ({getBaseStateDistanceKm(location.state) + lastMileKm} KM total):</span>
                          <span>+{formatNaira(Math.round((getBaseStateDistanceKm(location.state) + lastMileKm) * 15))}</span>
                        </div>
                        {deliveryUrgency !== 'economy' && (
                          <div className="flex items-center justify-between text-[9px] text-gray-450 pl-2">
                            <span>• Urgency speed premium ({deliveryUrgency === 'speedy' ? 'Swift Express' : 'Flash Sameday'}):</span>
                            <span>+{formatNaira(deliveryUrgency === 'speedy' ? 1800 : 4500)}</span>
                          </div>
                        )}
                      </div>
                      <div className="pt-1.5 flex items-center justify-between font-black text-gray-900 dark:text-white text-sm">
                        <span>Total:</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-mono text-base">
                          {formatNaira(cartTotalAmount + getDynamicDeliveriCost((DEFAULT_LOGISTICS_PROVIDERS.find(o => o.id === selectedDeliveriId) || DEFAULT_LOGISTICS_PROVIDERS[0]).baseFee))}
                        </span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isProcessingPayment}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-extrabold text-xs tracking-wider uppercase shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>
                        {isProcessingPayment
                          ? 'Processing Payment…'
                          : paymentMethod === 'card'
                          ? 'Pay Securely with Paystack'
                          : 'Confirm & Place Order'}
                      </span>
                    </button>
                    <button
                      type="button"
                      disabled={isProcessingPayment}
                      onClick={() => setCheckoutStep('cart')}
                      className="w-full py-2 border border-gray-200 dark:border-gray-800 text-gray-500 text-xs font-bold rounded-xl hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      Cancel Address Select
                    </button>
                  </div>
                </form>
              )}

              {/* Checkout step 3: Success state */}
              {checkoutStep === 'success' && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center animate-bounce">
                    <Check className="w-9 h-9 stroke-[3]" />
                  </div>
                  <h3 className="font-black text-lg text-gray-900 dark:text-white">Order Offer Broadcasted!</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">
                    Splendid! Your purchase order is sent to the multivendor channels. The corresponding vendor has been notified inside their interactive sales panel!
                  </p>
                  <button
                    onClick={handleFinishSuccess}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    View active orders status
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 4: PROFILE & ORDERS SCREEN */}
          {navTab === 'profile' && (
            <motion.div
              key="buyer-profile"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 space-y-4 text-left"
            >
              {!currentUser ? (
                <div className="min-h-[60vh] flex items-center justify-center py-10">
                  <div className="w-full max-w-sm text-center space-y-5">
                    <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <User className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-gray-900 dark:text-white">Your TradeEase account</h2>
                      <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
                        Sign in to view your orders, wallet, saved addresses and account settings.
                        New to TradeEase? Create an account to get started.
                      </p>
                    </div>
                    <div className="space-y-2.5">
                      <button
                        onClick={() => onTriggerLogin('buyer')}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm cursor-pointer"
                      >
                        Log In
                      </button>
                      <button
                        onClick={() => onTriggerLogin('buyer')}
                        className="w-full py-3 border border-emerald-600 text-emerald-700 dark:text-emerald-400 rounded-xl font-bold text-sm cursor-pointer"
                      >
                        Create Account
                      </button>
                      <button
                        onClick={() => setNavTab('sell')}
                        className="w-full py-3 border border-amber-500/50 text-amber-700 dark:text-amber-400 rounded-xl font-bold text-sm cursor-pointer"
                      >
                        Sell on TradeEase
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
              {/* Simple Back button if in subtab view */}
              {profileSubTab !== 'info' && (
                <div className="flex items-center gap-1.5 pb-1 select-none">
                  <button
                    onClick={() => setProfileSubTab('info')}
                    className="flex items-center gap-1 text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2.5 py-1 rounded-lg cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Account</span>
                  </button>
                  <span className="text-[10px] text-gray-400 font-bold uppercase font-mono">
                    / {profileSubTab} section
                  </span>
                </div>
              )}

              {/* SECTION A: USER PRIMARY BIO & WALLET SUMMARY CARD (Always shown on profile home) */}
              {profileSubTab === 'info' && (
                <>
                  {currentUser ? (
                    <div className="p-4 bg-white dark:bg-slate-950 border border-gray-150 dark:border-gray-800 rounded-2xl flex items-center justify-between gap-3.5 shadow-xs">
                      <div className="flex items-center gap-3">
                        {currentUser.avatar ? (
                          <img
                            src={currentUser.avatar}
                            alt={currentUser.name}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-emerald-600/10 text-emerald-600 flex items-center justify-center font-bold text-lg border border-emerald-500/20 shrink-0">
                            <User className="w-6 h-6" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-1.5 leading-none">
                            <span>{currentUser.name}</span>
                            <span className="text-[8px] bg-emerald-500/10 text-emerald-650 px-1.5 py-0.5 rounded uppercase font-mono font-bold tracking-wider">
                              {currentUser.provider}
                            </span>
                          </h3>
                          <p className="text-[10px] text-gray-400 mt-1">{currentUser.email}</p>
                          <p className="text-[10px] font-medium text-emerald-650 dark:text-emerald-400 mt-0.5">{location.city}, {location.state} Hub (NGA)</p>
                        </div>
                      </div>
                      
                      <button
                        onClick={onLogout}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer shrink-0"
                        title="Sign Out of TradeEase"
                      >
                        <LogOut className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 bg-white dark:bg-slate-950 border border-gray-150 dark:border-gray-800 rounded-2xl space-y-3 shadow-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">Account</h3>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">Sign in to access your account.</p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => onTriggerLogin()}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-[11px] uppercase tracking-wide flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <LogIn className="w-4 h-4" />
                        <span>Sign In</span>
                      </button>
                    </div>
                  )}

                  {/* NAIJA WALLET CARD (Interactive) */}
                  <div className="p-4 bg-radial from-slate-900 via-slate-950 to-emerald-950 text-white rounded-2xl border border-emerald-900/30 shadow-md space-y-3 relative overflow-hidden">
                    <div className="absolute top-2 right-2 w-28 h-28 bg-emerald-555/5 rounded-full blur-xl" />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-emerald-400" />
                        <span className="text-[10px] font-extrabold text-gray-350 tracking-wider uppercase font-mono">
                          Wallet
                        </span>
                      </div>
                      <span className="text-[8px] bg-emerald-500/25 text-emerald-400 font-bold uppercase tracking-widest px-2 py-0.5 rounded-full">
                        Paystack
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[9px] text-gray-400 block">Available balance</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black tracking-tight text-white">{formatNaira(walletBalance)}</span>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">NGN</span>
                      </div>
                    </div>

                    <div className="flex gap-2.5 pt-1.5">
                      <button
                        onClick={() => {
                          setFundingStep('input');
                          setFundingAmount('');
                          setIsFundingOverlayOpen(true);
                        }}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-[10.5px] uppercase tracking-wider flex items-center justify-center gap-1 shrink-0 cursor-pointer shadow-sm active:scale-95 duration-100"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Fund Wallet</span>
                      </button>
                      <button
                        onClick={() => setProfileSubTab('wallet')}
                        className="flex-1 py-2 bg-white/10 hover:bg-white/15 text-white/95 rounded-xl font-bold text-[10.5px] uppercase tracking-wider flex items-center justify-center gap-1 shrink-0 cursor-pointer transition-colors"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>Log Details</span>
                      </button>
                    </div>
                  </div>

                  {/* ACCOUNT DASHBOARD ACTION MENU ITEMS */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => setProfileSubTab('orders')}
                      className="p-3 bg-white dark:bg-slate-950 border border-emerald-555/20 dark:border-emerald-500/10 rounded-xl text-left space-y-1.5 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-slate-900/40 relative overflow-hidden"
                    >
                      <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-550 animate-pulse" />
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-[11px] text-gray-900 dark:text-white uppercase tracking-wider">
                          Order History
                        </h4>
                        <span className="text-[9px] text-gray-400 block font-medium">
                          Waybills & Live Status ({orders.length})
                        </span>
                      </div>
                    </button>

                    <button
                      onClick={() => setProfileSubTab('ebooks')}
                      className="p-3 bg-white dark:bg-slate-950 border border-purple-500/15 dark:border-purple-500/10 rounded-xl text-left space-y-1.5 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-slate-900/40 relative overflow-hidden"
                    >
                      <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                      <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-[11px] text-gray-900 dark:text-white uppercase tracking-wider">
                          Secure E-Book Vault
                        </h4>
                        <span className="text-[9px] text-gray-400 block">
                          Author License reading
                        </span>
                      </div>
                    </button>

                    <button
                      onClick={() => setProfileSubTab('addresses')}
                      className="p-3 bg-white dark:bg-slate-950 border border-gray-150 dark:border-gray-800 rounded-xl text-left space-y-1.5 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-slate-900/40"
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-[11px] text-gray-900 dark:text-white uppercase tracking-wider">
                          Address Book
                        </h4>
                        <span className="text-[9px] text-gray-400 block">
                          {savedAddresses.length} saved dispatch hubs
                        </span>
                      </div>
                    </button>

                    <button
                      onClick={() => setProfileSubTab('edit-profile')}
                      className="p-3 bg-white dark:bg-slate-950 border border-gray-150 dark:border-gray-800 rounded-xl text-left space-y-1.5 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-slate-900/40"
                    >
                      <div className="w-7 h-7 rounded-lg bg-blue-550/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <Edit3 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-[11px] text-gray-900 dark:text-white uppercase tracking-wider">
                          Edit Profile
                        </h4>
                        <span className="text-[9px] text-gray-400 block">
                          Update name & contacts
                        </span>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setProfileSubTab('wallet');
                      }}
                      className="p-3 bg-white dark:bg-slate-950 border border-gray-150 dark:border-gray-800 rounded-xl text-left space-y-1.5 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-slate-900/40"
                    >
                      <div className="w-7 h-7 rounded-lg bg-purple-550/10 text-purple-600 dark:text-purple-450 flex items-center justify-center">
                        <Wallet className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-[11px] text-gray-900 dark:text-white uppercase tracking-wider">
                          Transaction Logs
                        </h4>
                        <span className="text-[9px] text-gray-400 block">
                          Settlement audits
                        </span>
                      </div>
                    </button>

                    <button
                      onClick={() => setProfileSubTab('settings')}
                      className="p-3 bg-white dark:bg-slate-950 border border-gray-150 dark:border-gray-800 rounded-xl text-left space-y-1.5 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-slate-900/40"
                    >
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-450 flex items-center justify-center">
                        <Settings className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-[11px] text-gray-900 dark:text-white uppercase tracking-wider">
                          Prefs & Safety
                        </h4>
                        <span className="text-[9px] text-gray-400 block">
                          Notifications & Payments
                        </span>
                      </div>
                    </button>
                  </div>

                  {/* ACTIVE TRACKED ORDERS WITH EXPANDABLE DYNAMIC STEPS LOGS */}
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Package className="w-4.5 h-4.5 text-gray-400" />
                        <h3 className="text-xs font-black text-gray-950 dark:text-gray-300 uppercase tracking-wider pl-0.5">
                          My Purchases Tracking ({orders.length})
                        </h3>
                      </div>
                      <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-md font-mono">
                        Secure Payments
                      </span>
                    </div>

                    {orders.length === 0 ? (
                      <div className="text-center py-7 bg-white dark:bg-slate-950 rounded-xl border border-dashed border-gray-250 dark:border-gray-800/85">
                        <Package className="w-8 h-8 text-gray-300 dark:text-gray-750 mx-auto mb-1.5" />
                        <p className="text-[11px] text-gray-450 dark:text-gray-500">
                          You haven't placed any merchant orders yet.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {[...orders].reverse().map((od) => {
                          const isCurrentlyExpanded = checkoutError === od.id; // Toggle expansion utilizing temporary storage
                          return (
                            <div
                              key={`ord-${od.id}`}
                              className={`bg-white dark:bg-slate-950 border rounded-xl overflow-hidden shadow-xs transition-shadow duration-150 ${
                                isCurrentlyExpanded ? 'border-emerald-500/30 ring-1 ring-emerald-500/10' : 'border-gray-200 dark:border-gray-800/80'
                              }`}
                            >
                              {/* Order Card Header */}
                              <div
                                onClick={() => setCheckoutError(isCurrentlyExpanded ? '' : od.id)}
                                className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-550/5 select-none"
                              >
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-black text-gray-900 dark:text-gray-250 font-mono bg-gray-100 dark:bg-slate-900 px-1.5 py-0.5 rounded">
                                      {od.id}
                                    </span>
                                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                      {new Date(od.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                  </div>
                                  <p className="text-[9px] text-gray-400 dark:text-gray-500 font-mono mt-0.5">
                                    {od.items.length} item{od.items.length > 1 ? 's' : ''} • {formatNaira(od.totalAmount)}
                                  </p>
                                </div>

                                <div className="flex items-center gap-2">
                                  {/* Dynamic status badge */}
                                  <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded-md ${
                                    od.status === 'Pending' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-600' :
                                    od.status === 'Processing' ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-600' :
                                    od.status === 'Shipped' ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-600' :
                                    'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600'
                                  }`}>
                                    {od.status}
                                  </span>
                                  <span className="text-gray-400 font-bold text-xs">
                                    {isCurrentlyExpanded ? '▲' : '▼'}
                                  </span>
                                </div>
                              </div>

                              {/* Jumia Tracked Delivery Steps Timeline (Expanded View) */}
                              {isCurrentlyExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  className="border-t border-gray-100 dark:border-gray-900 p-3 bg-gray-50/50 dark:bg-slate-900/10 space-y-3.5"
                                >
                                  {/* Item rows */}
                                  <div className="space-y-1.5 bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-gray-100 dark:border-gray-900">
                                    <span className="text-[8.5px] text-gray-400 uppercase font-black block">Consignment Contents</span>
                                    {od.items.map((item, idx) => (
                                      <div key={idx} className="flex justify-between text-[11px] text-gray-700 dark:text-gray-300">
                                        <span className="truncate pr-4">• {item.productTitle} <span className="text-[10px] text-gray-400 font-bold">x{item.quantity}</span></span>
                                        <span className="font-extrabold shrink-0">{formatNaira(item.price * item.quantity)}</span>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Multi-Carrier Logistics Tracking Console info */}
                                  <div className="p-3 bg-sky-50/55 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/30 rounded-xl space-y-2 text-left">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-1.5">
                                        <Truck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                                        <span className="text-[9px] bg-sky-500/10 text-sky-600 dark:text-sky-400 font-extrabold px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">
                                          {od.logisticsProviderName || 'DELIVERI Logistics'}
                                        </span>
                                      </div>
                                      <span className="text-[10px] font-mono font-black text-sky-600 dark:text-sky-400">
                                        {od.trackingNumber || od.deliveriTrackingNumber || 'TRK-381-8172'}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                                      <div className="bg-white/80 dark:bg-slate-900/50 p-2 rounded-lg border border-gray-100 dark:border-gray-800">
                                        <span className="text-[8.2px] text-gray-400 dark:text-gray-500 uppercase font-bold block">Fulfillment Method</span>
                                        <span className="font-extrabold text-gray-850 dark:text-slate-100 truncate block">{od.shippingMethod || 'DELIVERI Standard'}</span>
                                      </div>
                                      <div className="bg-white/80 dark:bg-slate-900/50 p-2 rounded-lg border border-gray-100 dark:border-gray-800">
                                        <span className="text-[8.2px] text-gray-400 dark:text-gray-500 uppercase font-bold block">Status Code</span>
                                        <span className="font-extrabold text-sky-600 dark:text-sky-400 flex items-center gap-1">
                                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse shrink-0" />
                                          {od.status === 'Pending' ? 'Preparing Pickup' :
                                           od.status === 'Processing' ? 'Rider Assigned' :
                                           od.status === 'Shipped' ? 'In Transit' :
                                           od.status === 'Cancelled' ? 'Cancelled' :
                                           'Delivered & Settled'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Dynamic Progress Timeline graph (Vertical list of steps) */}
                                  <div className="space-y-3 pl-1.5 relative border-l-2 border-dashed border-gray-200 dark:border-gray-800 ml-2">
                                    
                                    {/* Step 1: Order offer broadcasted */}
                                    <div className="relative pl-5 pb-0.5">
                                      <div className="absolute -left-[7px] top-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950 shadow-xs flex items-center justify-center" />
                                      <div className="leading-tight">
                                        <span className="text-[10.5px] font-black text-gray-900 dark:text-white flex items-center gap-1">
                                          <span>Order Placed & Broadcasted</span>
                                          <Check className="w-3 h-3 text-emerald-500 stroke-[4]" />
                                        </span>
                                        <span className="text-[8.5px] text-gray-400 block font-light">Broadcasted to verified Nigerian network vendors.</span>
                                      </div>
                                    </div>

                                    {/* Step 2: Payment confirmed */}
                                    <div className="relative pl-5 pb-0.5">
                                      <div className="absolute -left-[7px] top-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950 shadow-xs flex items-center justify-center" />
                                      <div className="leading-tight">
                                        <span className="text-[10.5px] font-black text-gray-900 dark:text-white flex items-center gap-1">
                                          <span>Payment Received</span>
                                          <Check className="w-3 h-3 text-emerald-500 stroke-[4]" />
                                        </span>
                                        <span className="text-[8.5px] text-gray-400 block font-light">Deposit confirmed in protected secure clearing vault.</span>
                                      </div>
                                    </div>

                                    {/* Step 3: Merchant Processing */}
                                    <div className="relative pl-5 pb-0.5">
                                      <div className={`absolute -left-[7px] top-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-950 shadow-xs ${
                                        od.status !== 'Pending' ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'
                                      }`} />
                                      <div className="leading-tight">
                                        <span className="text-[10.5px] font-black text-gray-900 dark:text-white">
                                          {od.status === 'Pending' ? 'Merchant Processing & Packaging' : 'Order Finished and Packaged'}
                                        </span>
                                        <span className="text-[8.5px] text-gray-400 block font-light">Vendor is sealing items and assembling dispatch notes in center.</span>
                                      </div>
                                    </div>

                                    {/* Step 4: Dispatch in Route */}
                                    <div className="relative pl-5 pb-0.5">
                                      <div className={`absolute -left-[7px] top-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-950 shadow-xs ${
                                        od.status === 'Shipped' || od.status === 'Delivered' ? 'bg-emerald-500' : 
                                        od.status === 'Processing' ? 'bg-blue-500 animate-pulse' : 'bg-gray-300 dark:bg-gray-800'
                                      }`} />
                                      <div className="leading-tight">
                                        <span className="text-[10.5px] font-black text-gray-900 dark:text-white">
                                          In Route / Dispatch Delivery Motor
                                        </span>
                                        <span className="text-[8.5px] text-gray-400 block font-light">Courier is shipping parcel to state center: {od.address}.</span>
                                      </div>
                                    </div>

                                    {/* Step 5: Delivered & Payment Released */}
                                    <div className="relative pl-5">
                                      <div className={`absolute -left-[7px] top-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-950 shadow-xs ${
                                        od.status === 'Delivered' ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-800'
                                      }`} />
                                      <div className="leading-tight">
                                        <span className="text-[10.5px] font-black text-gray-900 dark:text-white">
                                          Delivered & Payment Released
                                        </span>
                                        <span className="text-[8.5px] text-gray-400 block font-light">Consignee approves inspection, releasing merchant payout.</span>
                                      </div>
                                    </div>

                                  </div>

                                  {/* Delivery Target center info */}
                                  <div className="p-2.5 bg-white dark:bg-slate-950 rounded-lg text-[10.5px] text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-900">
                                    <span className="font-extrabold text-[9px] text-emerald-600 block uppercase">Destination Courier Center</span>
                                    <span className="font-bold text-gray-900 dark:text-slate-100">{od.buyerName} ({od.buyerPhone})</span>
                                    <p className="mt-0.5">{od.address}, {od.city}, {od.state} State Hub.</p>
                                  </div>
                                </motion.div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}


              {/* SECTION B: WALLET */}
              {profileSubTab === 'wallet' && (
                <div className="space-y-4">
                  <div className="p-5 bg-gradient-to-br from-emerald-900 to-emerald-700 text-white rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-bold text-emerald-200 uppercase tracking-widest">TradeEase Wallet</span>
                        <h3 className="font-black text-lg">Available Balance</h3>
                      </div>
                      <Wallet className="w-6 h-6 text-emerald-200" />
                    </div>
                    <div className="mt-4 text-3xl font-black">{walletLoading ? 'Loading…' : formatNaira(walletBalance)}</div>
                  </div>

                  <div className="bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 space-y-3">
                    <div>
                      <h4 className="text-sm font-black text-gray-900 dark:text-white">Fund your wallet</h4>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Add money securely through Paystack.</p>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {['2500','5000','15000','50000'].map((val) => (
                        <button key={val} onClick={() => setFundingAmount(val)} className={`py-2 rounded-lg text-xs font-bold border cursor-pointer ${fundingAmount === val ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300'}`}>
                          ₦{Number(val).toLocaleString()}
                        </button>
                      ))}
                    </div>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-sm font-bold text-gray-500">₦</span>
                      <input type="number" min="100" value={fundingAmount} onChange={(e) => setFundingAmount(e.target.value)} placeholder="Enter amount" className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-slate-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                    <button onClick={() => { setFundingError(''); setFundingStep('input'); setIsFundingOverlayOpen(true); }} disabled={!fundingAmount || Number(fundingAmount) < 100} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl font-bold text-xs uppercase cursor-pointer disabled:cursor-not-allowed">
                      Fund with Paystack
                    </button>
                    {fundingError && <p className="text-xs text-red-600 dark:text-red-400">{fundingError}</p>}
                  </div>

                  <div className="bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                      <h4 className="text-sm font-black text-gray-900 dark:text-white">Wallet transactions</h4>
                    </div>
                    {walletTransactions.length === 0 ? (
                      <p className="p-4 text-xs text-gray-500 dark:text-gray-400">No wallet transactions yet.</p>
                    ) : (
                      <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {walletTransactions.map((tx) => (
                          <div key={tx.id} className="p-3 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-900 dark:text-white">{tx.description || (tx.type === 'funding' ? 'Wallet funding' : tx.type)}</p>
                              <p className="text-[10px] text-gray-400">{tx.provider} · {tx.status} · {new Date(tx.created_at).toLocaleString()}</p>
                            </div>
                            <span className={`text-xs font-black shrink-0 ${tx.direction === 'credit' ? 'text-emerald-600' : 'text-red-500'}`}>{tx.direction === 'credit' ? '+' : '-'}{formatNaira(tx.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SECTION C: SUBTAB - SAVED ADDRESSES BOOK */}
              {profileSubTab === 'addresses' && (
                <div className="space-y-4">
                  <div className="bg-white dark:bg-slate-950 border border-gray-150 dark:border-gray-800 rounded-2xl p-4 space-y-3.5">
                    <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
                      {editingAddressIndex !== null ? "Edit saved address details" : "Add new dispatch coordinates"}
                    </h4>
                    
                    <div className="space-y-2">
                      <textarea
                        value={newAddressInput}
                        onChange={(e) => setNewAddressInput(e.target.value)}
                        placeholder="Plot number, block street name, town area center..."
                        rows={2}
                        className="w-full p-2.5 text-xs font-semibold rounded-xl border border-gray-250 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-950 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                      />
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (!newAddressInput) return;
                            if (editingAddressIndex !== null) {
                              const updated = [...savedAddresses];
                              updated[editingAddressIndex] = newAddressInput;
                              setSavedAddresses(updated);
                              setEditingAddressIndex(null);
                            } else {
                              setSavedAddresses([...savedAddresses, newAddressInput]);
                            }
                            setNewAddressInput('');
                          }}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer text-center"
                        >
                          {editingAddressIndex !== null ? "Apply Changes" : "Save Address"}
                        </button>
                        {editingAddressIndex !== null && (
                          <button
                            onClick={() => {
                              setEditingAddressIndex(null);
                              setNewAddressInput('');
                            }}
                            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* List of active addresses */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-black text-gray-950 dark:text-gray-300 uppercase tracking-widest pl-0.5">
                      Your Registered Dispatch Destinations
                    </h4>

                    {savedAddresses.map((addr, idx) => (
                      <div
                        key={`addr-${idx}`}
                        className="p-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 rounded-xl space-y-2 flex justify-between items-start gap-4"
                      >
                        <div className="flex items-start gap-2 text-xs">
                          <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[9px] bg-emerald-500/10 text-emerald-650 px-1.5 py-0.5 rounded font-black font-mono uppercase">
                              Hub {idx + 1} {idx === 0 ? "(Default)" : ""}
                            </span>
                            <p className="text-gray-700 dark:text-gray-300 mt-1 font-semibold leading-relaxed">
                              {addr}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => {
                              setNewAddressInput(addr);
                              setEditingAddressIndex(idx);
                            }}
                            className="p-1 px-2 text-[10px] uppercase font-black bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 rounded-md cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              const updated = savedAddresses.filter((_, i) => i !== idx);
                              setSavedAddresses(updated);
                              if (editingAddressIndex === idx) {
                                setEditingAddressIndex(null);
                                setNewAddressInput('');
                              }
                            }}
                            className="p-1 px-2 text-[10px] uppercase font-black bg-red-500/10 text-red-600 hover:bg-red-500/20 rounded-md cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}


              {/* SECTION D: SUBTAB - EDIT PROFILE FORM */}
              {profileSubTab === 'edit-profile' && currentUser && (
                <AccountSecurityPanel
                  currentUser={currentUser}
                  onUserUpdated={onUserUpdated}
                  onToast={showAccountToast}
                />
              )}


              {/* SECTION E: SUBTAB - OPTIONS & SYSTEM PREFERENCES */}
              {profileSubTab === 'settings' && (
                <div className="space-y-4">
                  <div className="bg-white dark:bg-slate-950 border border-gray-150 dark:border-gray-800 rounded-2xl p-4 space-y-4">
                    <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
                      TradeEase Nigeria Consumer Settings
                    </h4>

                    {/* Notification switch */}
                    <div className="flex items-center justify-between text-xs pb-3 border-b border-gray-100 dark:border-gray-900">
                      <div>
                        <p className="font-extrabold text-gray-900 dark:text-white">Push Alerts Delivery Tracker</p>
                        <span className="text-[9px] text-gray-400 block max-w-[210px]">
                          Trigger SMS & Webhook updates as soon as the dispatch rider claims package.
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={consentNotifications}
                        onChange={(e) => setConsentNotifications(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                      />
                    </div>

                    {/* Payment alert switch */}
                    <div className="flex items-center justify-between text-xs pb-1">
                      <div>
                        <p className="font-extrabold text-gray-900 dark:text-white">Payment Alerts</p>
                        <span className="text-[9px] text-gray-400 block max-w-[210px]">
                          Auto-remind checkout validation window constraints before dispatch auto-release.
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={consentPaymentReminders}
                        onChange={(e) => setConsentPaymentReminders(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Dark mode switch inside settings */}
                  <div className="bg-white dark:bg-slate-950 border border-gray-150 dark:border-gray-800 rounded-2xl p-3 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-extrabold text-gray-900 dark:text-white">Display Theme Mode</p>
                      <span className="text-[9px] text-gray-400">Toggle between Light & Dark interface</span>
                    </div>
                    
                    <button
                      onClick={onThemeToggle}
                      className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-650 dark:text-emerald-400 rounded-lg font-bold font-mono tracking-wide uppercase cursor-pointer"
                    >
                      {darkMode ? "Dark Theme Active" : "Light Theme Active"}
                    </button>
                  </div>

                  {/* Privacy & Your Data */}
                  {currentUser ? (
                    <div className="bg-white dark:bg-slate-950 border border-gray-150 dark:border-gray-800 rounded-2xl p-4 space-y-4">
                      <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
                        Privacy & Your Data
                      </h4>

                      {/* Download my data */}
                      <div className="flex items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-900">
                        <div className="flex-1">
                          <p className="font-extrabold text-gray-900 dark:text-white text-xs">Download My Data</p>
                          <span className="text-[9px] text-gray-400 block max-w-[220px]">
                            Get a copy of your profile, orders, vendor listings (if any), and support messages as a JSON file.
                          </span>
                          {dataExportError && (
                            <p className="text-[9px] text-red-500 font-bold mt-1">{dataExportError}</p>
                          )}
                        </div>
                        <button
                          onClick={handleDownloadMyData}
                          disabled={dataExportLoading}
                          className="shrink-0 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          {dataExportLoading ? 'Preparing…' : 'Download'}
                        </button>
                      </div>

                      {/* Delete my account */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-extrabold text-red-600 dark:text-red-400 text-xs">Delete My Account</p>
                          <span className="text-[9px] text-gray-400 block max-w-[220px]">
                            Permanently erases your account, orders, vendor listings, and support history. This cannot be undone.
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setDeleteAccountError(null);
                            setDeleteAccountPassword('');
                            setDeleteAccountConfirmText('');
                            setShowDeleteAccountModal(true);
                          }}
                          className="shrink-0 px-3 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-600 dark:text-red-400 rounded-xl text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-slate-950 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-center">
                      <p className="text-[10px] text-gray-400">
                        Log in to download a copy of your data or manage account deletion.
                      </p>
                    </div>
                  )}
                </div>
              )}


              {/* SECTION F: SUBTAB - SECURE E-BOOKS VAULT */}
              {profileSubTab === 'ebooks' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-1">
                    <div className="flex items-center gap-1.5 col-span-2">
                      <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
                        My Ebooks
                      </h3>
                    </div>
                    <span className="text-[9px] bg-purple-500/10 text-purple-600 dark:text-purple-400 font-extrabold uppercase px-2 py-0.5 rounded-full font-mono">
                      Protected
                    </span>
                  </div>

                  {/* Filter and find purchased ebooks */}
                  {(() => {
                    const purchasedEbooks = products.filter(p => {
                      // Allow any item from category ebooks to be readable for excellent playground/demo experience
                      return p.category === 'ebooks' || p.subcategory === 'e-books';
                    });

                    if (purchasedEbooks.length === 0) {
                      return (
                        <div className="text-center py-10 bg-white dark:bg-slate-950 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                          <BookOpen className="w-10 h-10 text-gray-300 dark:text-gray-750 mx-auto mb-2" />
                          <p className="text-xs text-gray-400">No digital purchases yet.</p>
                          <button
                            onClick={() => {
                              setSelectedCategory('ebooks');
                              setNavTab('categories');
                            }}
                            className="mt-3 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-[10px] uppercase font-bold tracking-wide rounded-xl cursor-pointer"
                          >
                            Browse E-Book Department
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        {selectedEbookProduct ? (
                          // ACTIVE READING INTERFACE (READER SCREEN EXCEEDING FIDELITY)
                          <div className="bg-white dark:bg-slate-950 border border-purple-500/20 rounded-2xl p-4 space-y-4 animate-fadeIn">
                            <div className="flex items-start justify-between pb-2 border-b border-gray-100 dark:border-gray-900">
                              <div>
                                <button
                                  onClick={() => setSelectedEbookProduct(null)}
                                  className="text-[10px] text-purple-600 dark:text-purple-400 font-extrabold uppercase tracking-tight flex items-center gap-1 cursor-pointer mb-1 bg-transparent border-none outline-none leading-none"
                                >
                                  ← Back to Vault
                                </button>
                                <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase leading-tight select-none">
                                  {selectedEbookProduct.title}
                                </h4>
                                <p className="text-[9px] text-gray-400 font-mono mt-0.5 leading-none">
                                  Preview Reader • By {selectedEbookProduct.vendorName}
                                </p>
                              </div>
                              <div className="bg-purple-500 text-white rounded-lg p-1.5 shrink-0 flex items-center justify-center">
                                <Lock className="w-4 h-4" />
                              </div>
                            </div>

                            {/* Secure Document Info */}
                            <div className="grid grid-cols-2 gap-2 text-[10px] bg-purple-500/5 p-2.5 rounded-xl border border-purple-500/10 font-mono">
                              <div>
                                <span className="text-[8px] text-gray-400 uppercase font-black block">FORMAT STATS</span>
                                <span className="text-gray-900 dark:text-white font-extrabold">{selectedEbookProduct.digitalSpecification?.fileType || "PDF"} Format</span>
                              </div>
                              <div>
                                <span className="text-[8px] text-gray-400 uppercase font-black block">INTEGRITY SIGNATURE</span>
                                <span className="text-purple-600 dark:text-purple-400 font-extrabold truncate block">
                                  {selectedEbookProduct.digitalSpecification?.shaHash || "SHA256:d82e1ba39be8214150x8c7f5f7c"}
                                </span>
                              </div>
                              <div className="col-span-2 pt-1 border-t border-purple-500/10">
                                <span className="text-[8px] text-gray-400 uppercase font-black block">DYNAMIC WATERMARK OVERLAY</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                                  {selectedEbookProduct.digitalSpecification?.watermarkText || `LICENSED EXCLUSIVELY TO: ${currentUser?.email || 'fauchagency@gmail.com'} (DO NOT LEAK)`}
                                </span>
                              </div>
                            </div>

                            {/* Obfuscated Content Reader Viewer */}
                            <div className="border border-gray-250 dark:border-gray-850 rounded-xl p-4 bg-gray-550/5 dark:bg-slate-900 relative overflow-hidden select-none text-left">
                              {/* Overlay Dynamic Watermark background in diagonal letters */}
                              <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none select-none z-0 transform -rotate-12">
                                <div className="text-slate-900 dark:text-white font-black text-sm uppercase tracking-widest text-center whitespace-pre-wrap">
                                  {selectedEbookProduct.digitalSpecification?.watermarkText || `LICENSED EXCLUSIVELY TO:\n${currentUser?.email || 'fauchagency@gmail.com'}`}
                                </div>
                              </div>

                              {/* Secure document structural contents */}
                              <div className="relative z-10 space-y-3 font-sans text-xs text-slate-750 dark:text-gray-300 leading-relaxed max-h-72 overflow-y-auto">
                                <span className="text-[9px] bg-purple-600 text-white px-1.5 py-0.5 rounded tracking-wider uppercase font-extrabold font-mono">
                                  Sample Preview
                                </span>
                                
                                <div className="space-y-2 text-left">
                                  <h5 className="font-extrabold text-xs text-gray-950 dark:text-white uppercase">Chapter 1: Getting Started</h5>
                                  <p className="text-slate-650 dark:text-gray-350 italic">
                                    "When running a multivendor business across Nigeria, the biggest friction usually isn't the cost of goods, it's getting deliveries through state-to-state clearance smoothly..."
                                  </p>
                                  <p>
                                    Work with a registered logistics partner for interstate deliveries, and always confirm pickup terminals ahead of time so customers aren't kept waiting.
                                  </p>
                                  <h5 className="font-extrabold text-xs text-gray-950 dark:text-white uppercase mt-4">Chapter 2: Accepting Payments Safely</h5>
                                  <p>
                                    Never store your Paystack or Flutterwave secret keys in code that runs in the browser. Keep them on your server, where customers and browser tools can't see them.
                                  </p>
                                  <h5 className="font-extrabold text-xs text-gray-950 dark:text-white uppercase mt-4">Chapter 3: Growing Through WhatsApp</h5>
                                  <p>
                                    A simple WhatsApp broadcast list, paired with a referral discount for existing customers, is often more effective for a small vendor than paid ads.
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-end pt-1">
                              <button
                                onClick={() => setSelectedEbookProduct(null)}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-[10.5px] uppercase font-black tracking-wider rounded-xl cursor-pointer"
                              >
                                Done Reading
                              </button>
                            </div>
                          </div>
                        ) : (
                          // GRID OF DISCOVERABLE & BUYER OWNED E-BOOKS
                          <div className="space-y-3">
                            {purchasedEbooks.map((bk) => {
                              const isDecrypting = isDecryptingEbook === bk.id;
                              const isDecrypted = decryptionSuccessMap[bk.id];
                              const logs = activeEbookLogMap[bk.id] || [];

                              return (
                                <div
                                  key={`vault-bk-${bk.id}`}
                                  className="p-3 bg-white dark:bg-slate-950 rounded-2xl flex flex-col gap-3 text-left border border-gray-150 dark:border-gray-800 shadow-xs hover:border-purple-500/25 duration-150"
                                >
                                  <div className="flex gap-3">
                                    {/* Cover Image Thumbnail */}
                                    <div className="w-14 h-16 rounded-lg bg-slate-100 dark:bg-slate-900 border border-gray-150 dark:border-gray-800 overflow-hidden shrink-0">
                                      <img src={bk.image} alt={bk.title} className="w-full h-full object-cover" />
                                    </div>
                                    
                                    {/* Info Panel */}
                                    <div className="flex-1 min-w-0">
                                      <span className="text-[8px] bg-purple-500/10 text-purple-600 dark:text-purple-400 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                                        {bk.digitalSpecification?.fileType || "PDF"} Container
                                      </span>
                                      <h4 className="font-extrabold text-xs text-gray-900 dark:text-white uppercase truncate mt-1">
                                        {bk.title}
                                      </h4>
                                      <p className="text-[9px] text-gray-450 dark:text-gray-500 mt-0.5">
                                        Publisher: {bk.vendorName}
                                      </p>
                                      
                                      {/* Obfuscation Metadata locks */}
                                      <div className="flex items-center gap-2 mt-1.5 text-[8px] font-mono text-gray-450 leading-none">
                                        <span className="flex items-center gap-0.5 text-purple-600 dark:text-purple-400 font-bold shrink-0">
                                          <Shield className="w-2.5 h-2.5 shrink-0" />
                                          Obfuscated DRM Locked
                                        </span>
                                        <span className="shrink-0">•</span>
                                        <span className="truncate max-w-[120px]">
                                          Hash: {bk.digitalSpecification?.shaHash || "0xBE3819A283"}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Decryption Controller */}
                                  <div className="pt-2 border-t border-gray-100 dark:border-gray-900">
                                    {isDecrypting ? (
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between text-[10px] text-purple-600 dark:text-purple-400 font-extrabold animate-pulse">
                                          <span>Strip Obfuscation & Lock Wrappers...</span>
                                          <span className="font-mono">{Math.min(100, logs.length * 15)}%</span>
                                        </div>
                                        <div className="w-full bg-purple-100 dark:bg-purple-950/40 h-2 rounded-full overflow-hidden relative">
                                          <div className="bg-purple-600 h-full rounded-full transition-all duration-200" style={{ width: `${Math.min(100, logs.length * 15)}%` }} />
                                        </div>
                                      </div>
                                    ) : isDecrypted ? (
                                      <div className="flex gap-2 flex-wrap">
                                        {bk.digitalSpecification?.epubFileName && (
                                          <button
                                            onClick={() => handleDownloadEbook(bk, 'epub')}
                                            disabled={downloadingEbook === `${bk.id}-epub`}
                                            className="px-2.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-[9px] uppercase font-black tracking-wider cursor-pointer border-none"
                                          >
                                            {downloadingEbook === `${bk.id}-epub` ? 'Downloading…' : 'Download EPUB'}
                                          </button>
                                        )}
                                        {bk.digitalSpecification?.pdfFileName && (
                                          <button
                                            onClick={() => handleDownloadEbook(bk, 'pdf')}
                                            disabled={downloadingEbook === `${bk.id}-pdf`}
                                            className="px-2.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-[9px] uppercase font-black tracking-wider cursor-pointer border-none"
                                          >
                                            {downloadingEbook === `${bk.id}-pdf` ? 'Downloading…' : 'Download PDF'}
                                          </button>
                                        )}
                                        <button
                                          onClick={() => setSelectedEbookProduct(bk)}
                                          className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-550 hover:to-indigo-550 text-white rounded-xl text-[10px] uppercase font-black tracking-wider shadow-sm flex items-center justify-center gap-1.5 cursor-pointer leading-none border-none"
                                        >
                                          <BookOpen className="w-3.5 h-3.5" />
                                          Open Secured Document
                                        </button>
                                        <button
                                          onClick={() => runEbookDecryptorSimulation(bk.id, bk.digitalSpecification?.watermarkText)}
                                          className="px-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-350 rounded-xl text-[10px] font-semibold uppercase tracking-wider cursor-pointer border-none"
                                          title="Re-verify Integrity Hash"
                                        >
                                          Re-Verify
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => runEbookDecryptorSimulation(bk.id, bk.digitalSpecification?.watermarkText)}
                                        className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[10px] uppercase font-black tracking-wider shadow-xs flex items-center justify-center gap-1 cursor-pointer border-none"
                                      >
                                        <Lock className="w-3.5 h-3.5" />
                                        Authorize & Decrypt License
                                      </button>
                                    )}

                                    {/* Terminal-Style Decrypting Output logs */}
                                    {logs.length > 0 && !isDecrypted && (
                                      <div className="mt-2.5 bg-slate-950 rounded-xl border border-purple-500/20 p-2 font-mono text-[8.2px] leading-normal text-purple-400 max-h-24 overflow-y-auto space-y-0.5">
                                        {logs.map((log, idx) => (
                                          <p key={idx} className="truncate">{log}</p>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}


              {/* SECTION G: SUBTAB - ORDER HISTORY & LIVE WAYBILLS */}
              {profileSubTab === 'orders' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between pb-1">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Package className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider truncate">
                          Order History
                        </h3>
                        <p className="text-[9px] text-gray-400 block font-medium">Track your orders</p>
                      </div>
                    </div>
                    <span className="text-[8.5px] bg-emerald-555/10 text-emerald-600 dark:text-emerald-400 font-extrabold uppercase px-2 py-0.5 rounded-full font-mono shrink-0">
                      Active
                    </span>
                  </div>

                  {/* Operational Dispute notification status block if any */}
                  {activeDisputeMessage && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 text-xs text-amber-800 dark:text-amber-400 space-y-2 flex flex-col relative">
                      <div className="flex items-start gap-2">
                        <span className="text-sm">⚠️</span>
                        <div className="flex-1 min-w-0 leading-relaxed font-sans font-medium">
                          <p className="font-extrabold text-[11px] uppercase tracking-wider text-amber-900 dark:text-amber-300">
                            Dispute Notice
                          </p>
                          <p className="mt-0.5 text-[10.5px]">
                            {activeDisputeMessage}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveDisputeMessage(null)}
                        className="self-end px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-[9px] font-black uppercase text-amber-900 dark:text-amber-300 rounded-lg cursor-pointer border-none"
                      >
                        Acknowledge & Close
                      </button>
                    </div>
                  )}

                  {/* LOGISTICS INDEX KPIS */}
                  {(() => {
                    const totalCount = orders.length;
                    const activeCount = orders.filter(o => o.status === 'Pending' || o.status === 'Processing' || o.status === 'Shipped').length;
                    const deliveredCount = orders.filter(o => o.status === 'Delivered').length;
                    const totalSpent = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
                    const pendingAmount = orders.filter(o => o.status === 'Pending' || o.status === 'Processing' || o.status === 'Shipped')
                                              .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

                    return (
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="bg-white dark:bg-slate-950 border border-gray-150 dark:border-gray-800 p-3 rounded-xl space-y-1">
                          <span className="text-[8.5px] text-gray-400 dark:text-gray-500 font-extrabold uppercase tracking-wide block">
                            Total Waybills
                          </span>
                          <p className="text-xs font-black text-gray-900 dark:text-white font-mono">
                            {totalCount} Purchase{totalCount !== 1 ? 's' : ''}
                          </p>
                        </div>

                        <div className="bg-white dark:bg-slate-950 border border-gray-150 dark:border-gray-800 p-3 rounded-xl space-y-1">
                          <span className="text-[8.5px] text-gray-400 dark:text-gray-500 font-extrabold uppercase tracking-wide block">
                            In Progress
                          </span>
                          <p className="text-xs font-black text-amber-600 dark:text-amber-450 font-mono">
                            {activeCount} Waybills Live
                          </p>
                        </div>

                        <div className="bg-white dark:bg-slate-950 border border-gray-150 dark:border-gray-800 p-3 rounded-xl space-y-1">
                          <span className="text-[8.5px] text-gray-400 dark:text-gray-500 font-extrabold uppercase tracking-wide block">
                            Total Account Spend
                          </span>
                          <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
                            {formatNaira(totalSpent)}
                          </p>
                        </div>

                        <div className="bg-white dark:bg-slate-950 border border-gray-150 dark:border-gray-800 p-3 rounded-xl space-y-1">
                          <span className="text-[8.5px] text-gray-400 dark:text-gray-500 font-extrabold uppercase tracking-wide block">
                            Pending Amount
                          </span>
                          <p className="text-xs font-black text-sky-600 dark:text-sky-400 font-mono">
                            {formatNaira(pendingAmount)}
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* SEARCH & FILTERS CONTROLS */}
                  <div className="space-y-2 bg-white dark:bg-slate-950 border border-gray-150 dark:border-gray-800 p-3 rounded-2xl">
                    <div className="relative">
                      <input
                        type="text"
                        value={orderSearchQuery}
                        onChange={(e) => setOrderSearchQuery(e.target.value)}
                        placeholder="Search orders (ID, address, city, product)..."
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                      />
                      {orderSearchQuery && (
                        <button
                          onClick={() => setOrderSearchQuery('')}
                          className="absolute right-2.5 top-2.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-350 font-bold text-xs cursor-pointer border-none bg-transparent"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Filter chips */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] as const).map((filterVal) => {
                        const count = filterVal === 'All' 
                          ? orders.length 
                          : orders.filter((o) => o.status === filterVal).length;

                        const isSelected = orderStatusFilter === filterVal;

                        return (
                          <button
                            key={`filter-${filterVal}`}
                            onClick={() => setOrderStatusFilter(filterVal)}
                            className={`px-2.5 py-1 rounded-lg text-[9px] uppercase font-black tracking-wider transition-all border shrink-0 cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                                : 'bg-slate-50 border-gray-150 dark:bg-slate-900 dark:border-gray-800 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                          >
                            {filterVal} ({count})
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ORDERS LOOP */}
                  {(() => {
                    const filteredOrders = orders.filter((o) => {
                      const statusMatches = orderStatusFilter === 'All' || o.status === orderStatusFilter;
                      
                      const searchLower = orderSearchQuery.toLowerCase();
                      const queryMatches = !orderSearchQuery || 
                        o.id.toLowerCase().includes(searchLower) ||
                        (o.address || '').toLowerCase().includes(searchLower) ||
                        (o.city || '').toLowerCase().includes(searchLower) ||
                        (o.buyerName || '').toLowerCase().includes(searchLower) ||
                        o.items.some(it => it.productTitle.toLowerCase().includes(searchLower));

                      return statusMatches && queryMatches;
                    });

                    if (filteredOrders.length === 0) {
                      return (
                        <div className="text-center py-10 bg-white dark:bg-slate-950 rounded-2xl border border-dashed border-gray-250 dark:border-gray-800/80">
                          <Package className="w-10 h-10 text-gray-300 dark:text-gray-750 mx-auto mb-2" />
                          <p className="text-xs text-gray-450 dark:text-gray-500">
                            No orders match your active search settings.
                          </p>
                          {(orderSearchQuery || orderStatusFilter !== 'All') && (
                            <button
                              onClick={() => {
                                setOrderSearchQuery('');
                                setOrderStatusFilter('All');
                              }}
                              className="mt-3 px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 text-[10px] uppercase font-black tracking-wide rounded-xl cursor-pointer"
                            >
                              Reset Filters
                            </button>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        {[...filteredOrders].reverse().map((od) => {
                          const isCurrentlyExpanded = checkoutError === od.id; // Toggle expansion utilizing temporary storage
                          
                          return (
                            <div
                              key={`ord-ledger-${od.id}`}
                              className={`bg-white dark:bg-slate-950 border rounded-2xl overflow-hidden shadow-xs transition-all duration-200 ${
                                isCurrentlyExpanded ? 'border-emerald-500/35 ring-1 ring-emerald-500/10' : 'border-gray-150 dark:border-gray-800/80'
                              }`}
                            >
                              {/* Order Card Header clickable to collapse/expand */}
                              <div
                                onClick={() => setCheckoutError(isCurrentlyExpanded ? '' : od.id)}
                                className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-500/5 select-none"
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-black text-gray-950 dark:text-white font-mono bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded">
                                      {od.id}
                                    </span>
                                    <span className="text-[10px] text-gray-450 dark:text-gray-450 font-mono">
                                      {new Date(od.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                  </div>
                                  <p className="text-[10.5px] text-gray-550 dark:text-gray-400 font-semibold font-sans">
                                    {od.items.length} item{od.items.length > 1 ? 's' : ''} • <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{formatNaira(od.totalAmount)}</span>
                                  </p>
                                </div>

                                <div className="flex items-center gap-2.5">
                                  {/* Waybill Status Badge */}
                                  <span className={`text-[8.5px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md ${
                                    od.status === 'Pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
                                    od.status === 'Processing' ? 'bg-blue-150 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' :
                                    od.status === 'Shipped' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400' :
                                    od.status === 'Cancelled' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' :
                                    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/45 dark:text-emerald-400'
                                  }`}>
                                    {od.status}
                                  </span>
                                  <span className="text-gray-400 font-extrabold text-xs">
                                    {isCurrentlyExpanded ? '▲' : '▼'}
                                  </span>
                                </div>
                              </div>

                              {/* Collapsible expanded section of order info */}
                              {isCurrentlyExpanded && (
                                <div className="border-t border-gray-100 dark:border-gray-900/50 p-3.5 bg-slate-550/5 dark:bg-slate-900/10 space-y-3.5 text-left">
                                  {/* Estimated Delivery Date Header Banner */}
                                  {(() => {
                                    const orderDateObj = new Date(od.date);
                                    const estStart = new Date(orderDateObj);
                                    estStart.setDate(orderDateObj.getDate() + 2);
                                    const estEnd = new Date(orderDateObj);
                                    estEnd.setDate(orderDateObj.getDate() + 3);
                                    const formatOpt: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };

                                    let bgClass = "bg-sky-500/5 border-sky-500/15 text-sky-700 dark:text-sky-450";
                                    let statusSubtext = "Deliveries within Lagos and neighboring hub regions routinely complete in 48-72 hours.";
                                    let deliveryLabel = "Estimated Delivery Window";
                                    let deliveryDateStr = `${estStart.toLocaleDateString(undefined, formatOpt)} - ${estEnd.toLocaleDateString(undefined, formatOpt)}`;

                                    if (od.status === 'Delivered') {
                                      bgClass = "bg-emerald-500/5 border-emerald-550/15 text-emerald-700 dark:text-emerald-400";
                                      statusSubtext = "Delivery confirmed. Payment has been released to the vendor.";
                                      deliveryLabel = "Actual Delivery Confirmed";
                                      deliveryDateStr = estStart.toLocaleDateString(undefined, formatOpt);
                                    } else if (od.status === 'Cancelled') {
                                      bgClass = "bg-rose-500/5 border-rose-500/15 text-rose-700 dark:text-rose-450";
                                      statusSubtext = "This order was cancelled. Your payment will be refunded to your wallet.";
                                      deliveryLabel = "Waybill Status";
                                      deliveryDateStr = "Cancelled";
                                    } else if (od.status === 'Shipped') {
                                      bgClass = "bg-purple-500/5 border-purple-500/15 text-purple-700 dark:text-purple-450";
                                      statusSubtext = "Your order is on its way.";
                                      deliveryLabel = "Target Delivery Projection";
                                      deliveryDateStr = `${estStart.toLocaleDateString(undefined, formatOpt)} (In Transit)`;
                                    } else if (od.status === 'Processing') {
                                      bgClass = "bg-blue-500/5 border-blue-500/15 text-blue-700 dark:text-blue-450";
                                      statusSubtext = "Supplier has registered the shipping consignment and is printing logistics waybills.";
                                      deliveryLabel = "Projected Delivery Window";
                                    }

                                    return (
                                      <div className={`border rounded-xl p-3 flex items-start gap-3 ${bgClass}`}>
                                        <Calendar className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                                        <div className="flex-1 min-w-0 font-sans text-xs">
                                          <span className="text-[8.5px] font-black uppercase tracking-wider block opacity-70">
                                            {deliveryLabel}
                                          </span>
                                          <p className="font-extrabold text-[12.5px] tracking-tight leading-tight mt-0.5">
                                            {deliveryDateStr}
                                          </p>
                                          <p className="text-[9.5px] opacity-80 mt-1 leading-relaxed font-semibold">
                                            {statusSubtext}
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  })()}

                                  {/* Delivery specifications */}
                                  <div className="grid grid-cols-2 gap-2.5 font-sans">
                                    <div className="bg-white dark:bg-slate-950 border border-gray-150 dark:border-gray-800 p-2.5 rounded-xl">
                                      <span className="text-[8px] text-gray-400 dark:text-gray-500 font-extrabold uppercase tracking-wider block mb-0.5">
                                        RECIPIENT CONSIGNEE
                                      </span>
                                      <p className="text-[11px] font-black text-gray-900 dark:text-white truncate">
                                        {od.buyerName}
                                      </p>
                                      <p className="text-[10px] text-gray-450 font-mono mt-0.5">{od.buyerPhone}</p>
                                    </div>

                                    <div className="bg-white dark:bg-slate-950 border border-gray-150 dark:border-gray-800 p-2.5 rounded-xl">
                                      <span className="text-[8px] text-gray-400 dark:text-gray-500 font-extrabold uppercase tracking-wider block mb-0.5">
                                        CARRIER WAYBILL ({od.logisticsProviderName || 'DELIVERI'})
                                      </span>
                                      <p className="text-[11px] font-black text-emerald-650 dark:text-emerald-400 font-mono truncate">
                                        {od.trackingNumber || od.deliveriTrackingNumber || 'TRK-621-NGA'}
                                      </p>
                                      <p className="text-[10px] text-gray-450 truncate mt-0.5 uppercase tracking-tight">{od.shippingMethod || 'Standard Ground'}</p>
                                    </div>
                                  </div>

                                  {/* Product Items Rows */}
                                  <div className="bg-white dark:bg-slate-950 border border-gray-150 dark:border-gray-800 p-3 rounded-xl space-y-2">
                                    <span className="text-[8px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest block">
                                      Items Sealed in this Waybill
                                    </span>
                                    {od.items.map((item, idx) => (
                                      <div key={`od-ledger-item-${idx}`} className="flex items-center gap-2.5 justify-between py-1 border-b border-gray-105 last:border-b-0 dark:border-slate-900">
                                        <div className="flex items-center gap-2 min-w-0">
                                          {item.image && (
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-900 border border-gray-150 dark:border-gray-800 overflow-hidden shrink-0">
                                              <img src={item.image} alt={item.productTitle} className="w-full h-full object-cover" />
                                            </div>
                                          )}
                                          <div className="min-w-0">
                                            <p className="text-[11px] font-bold text-gray-900 dark:text-white truncate">
                                              {item.productTitle}
                                            </p>
                                            <p className="text-[9.5px] text-gray-400 font-mono">
                                              NGN {item.price.toLocaleString()} x {item.quantity}
                                            </p>
                                          </div>
                                        </div>
                                        <span className="text-[11px] font-black text-gray-900 dark:text-white font-mono shrink-0">
                                          {formatNaira(item.price * item.quantity)}
                                        </span>
                                      </div>
                                    ))}
                                    
                                    {/* Subtotal & Delivery waybill cost */}
                                    <div className="pt-2 border-t border-gray-100 dark:border-slate-900 space-y-1 text-[10.5px] font-semibold text-gray-500 dark:text-gray-400 font-sans">
                                      <div className="flex justify-between">
                                        <span>Consignments Value:</span>
                                        <span className="font-mono text-gray-900 dark:text-white">{formatNaira(od.totalAmount - (od.shippingCost || 500))}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Logistics Delivery Terminal Waybill:</span>
                                        <span className="font-mono text-gray-900 dark:text-white">{formatNaira(od.shippingCost || 500)}</span>
                                      </div>
                                      <div className="flex justify-between text-xs font-black text-emerald-650 dark:text-emerald-400 pt-1 border-t border-dashed border-gray-150 dark:border-gray-800">
                                        <span>Total:</span>
                                        <span className="font-mono">{formatNaira(od.totalAmount)}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* DELIVERY INTERACTIVE PROGRESS TIMELINE */}
                                  <div className="bg-white dark:bg-slate-950 border border-gray-150 dark:border-gray-800 p-3.5 rounded-xl space-y-3">
                                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-900/50 pb-2">
                                      <span className="text-[8px] text-gray-400 dark:text-gray-500 font-extrabold uppercase tracking-wider">
                                        Live Waybill Waypoint Status Tracker
                                      </span>
                                      <span className="text-[9px] font-mono text-emerald-650 dark:text-emerald-400 font-black bg-emerald-500/10 px-1.5 py-0.5 rounded leading-none uppercase">
                                        {od.status === 'Pending' ? 'Preparing Shipment' :
                                         od.status === 'Processing' ? 'Carrier Assigned' :
                                         od.status === 'Shipped' ? 'In Transit / Out on Motor' :
                                         od.status === 'Cancelled' ? 'Waybill Cancelled' :
                                         'Arrived & Payment Released'}
                                      </span>
                                    </div>

                                    <div className="space-y-3.5 pl-1.5 relative border-l border-dashed border-slate-200 dark:border-slate-800 ml-1 pb-1">
                                      
                                      {/* Point 1: Order offer broadcasted */}
                                      <div className="relative pl-5">
                                        <div className="absolute -left-[4.5px] top-1 w-2 h-2 rounded-full bg-emerald-500" />
                                        <div className="text-left leading-normal">
                                          <p className="text-[10px] font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                                            <span>Order Placed & Confirmed</span>
                                            <Check className="w-3 h-3 text-emerald-500 stroke-[4]" />
                                          </p>
                                          <span className="text-[8.5px] text-gray-400 dark:text-gray-500 block">Digitally broadcasted to network vendors inside TradeEase Lagos clearing.</span>
                                        </div>
                                      </div>

                                      {/* Point 2: Payment confirmed */}
                                      <div className="relative pl-5">
                                        <div className="absolute -left-[4.5px] top-1 w-2 h-2 rounded-full bg-emerald-500" />
                                        <div className="text-left leading-normal">
                                          <p className="text-[10px] font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                                            <span>Payment Received</span>
                                            <Check className="w-3 h-3 text-emerald-500 stroke-[4]" />
                                          </p>
                                          <span className="text-[8.5px] text-gray-400 dark:text-gray-500 block">Payment received and held securely until delivery.</span>
                                        </div>
                                      </div>

                                      {/* Point 3: Merchant Processing */}
                                      <div className="relative pl-5">
                                        <div className={`absolute -left-[4.5px] top-1 w-2 h-2 rounded-full ${
                                          od.status !== 'Pending' ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'
                                        }`} />
                                        <div className="text-left leading-normal">
                                          <p className="text-[10px] font-black text-gray-900 dark:text-white">
                                            {od.status === 'Pending' ? 'Merchant Processing & Custom Packaging' : 'Order Finished and Sealed'}
                                          </p>
                                          <span className="text-[8.5px] text-gray-400 dark:text-gray-500 block">The supplier packages items and records the physical Waybill inside the hub.</span>
                                        </div>
                                      </div>

                                      {/* Point 4: Dispatch in Route */}
                                      <div className="relative pl-5">
                                        <div className={`absolute -left-[4.5px] top-1 w-2 h-2 rounded-full ${
                                          od.status === 'Shipped' || od.status === 'Delivered' ? 'bg-emerald-500' : 
                                          od.status === 'Processing' ? 'bg-blue-500 animate-pulse' : 'bg-slate-200 dark:bg-slate-800'
                                        }`} />
                                        <div className="text-left leading-normal">
                                          <p className="text-[10px] font-black text-gray-900 dark:text-white">
                                            Interstate Transit Waybill Waypoint
                                          </p>
                                          <span className="text-[8.5px] text-gray-400 dark:text-gray-500 block">Courier bike is shipping parcel to state center destination terminal: {od.city}.</span>
                                        </div>
                                      </div>

                                      {/* Point 5: Delivered & Payment Released */}
                                      <div className="relative pl-5">
                                        <div className={`absolute -left-[4.5px] top-1 w-2 h-2 rounded-full ${
                                          od.status === 'Delivered' ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                                        }`} />
                                        <div className="text-left leading-normal">
                                          <p className="text-[10px] font-black text-gray-900 dark:text-white">
                                            Delivered & Payment Released
                                          </p>
                                          <span className="text-[8.5px] text-gray-400 dark:text-gray-500 block">Buyer confirms delivery and approves payment release.</span>
                                        </div>
                                      </div>

                                    </div>

                                    {/* Recipient Full dispatch address */}
                                    <div className="bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border border-gray-150 dark:border-gray-800 text-[10.5px] text-gray-550 dark:text-gray-400 font-sans">
                                      <span className="font-extrabold text-[8.5px] text-emerald-650 block uppercase mb-0.5">HUB ROUTING LOCATION</span>
                                      <p>{od.address}, {od.city}, {od.state} State Hub Terminal.</p>
                                    </div>
                                  </div>

                                  {/* INTERACTIVE ACTIONS TO CHANGE ORDER STATUS FROM THE BUYER VIEW */}
                                  <div className="flex flex-col gap-2 pt-1 border-t border-gray-100 dark:border-slate-900">
                                    <div className="flex gap-2">
                                      {od.status === 'Shipped' && onUpdateOrderStatus && (
                                        <button
                                          onClick={() => {
                                            onUpdateOrderStatus(od.id, 'Delivered');
                                          }}
                                          className="flex-1 py-2 px-3 bg-emerald-650 hover:bg-emerald-655 text-white rounded-xl text-[10px] uppercase font-black tracking-wider shadow-sm flex items-center justify-center gap-1.5 cursor-pointer border-none"
                                        >
                                          <Check className="w-3.5 h-3.5 stroke-[4]" />
                                          Accept & Release Payout
                                        </button>
                                      )}

                                      {od.status === 'Processing' && onUpdateOrderStatus && (
                                        <button
                                          onClick={() => {
                                            onUpdateOrderStatus(od.id, 'Shipped');
                                          }}
                                          className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-550 text-white rounded-xl text-[10px] uppercase font-black tracking-wider shadow-sm flex items-center justify-center gap-1.5 cursor-pointer border-none"
                                          title="Simulate interstate courier bike route dispatch"
                                        >
                                          <Truck className="w-3.5 h-3.5" />
                                          Dispatch Waybill
                                        </button>
                                      )}

                                      {(od.status === 'Pending' || od.status === 'Processing') && onUpdateOrderStatus && (
                                        <button
                                          onClick={() => {
                                            onUpdateOrderStatus(od.id, 'Cancelled');
                                          }}
                                          className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/25 dark:text-rose-400 rounded-xl text-[10px] uppercase font-black tracking-wider cursor-pointer border-none flex items-center justify-center gap-1"
                                        >
                                          Cancel Purchase
                                        </button>
                                      )}

                                      <button
                                        onClick={() => {
                                          setActiveDisputeMessage(`Opened dispute #DSP-${od.id.slice(1)}. Your payment for this order has been placed on hold while our team reviews it. We're contacting the vendor${od.items[0]?.productTitle ? ` about "${od.items[0].productTitle}"` : ''} now.`);
                                        }}
                                        className="py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-650 dark:text-gray-300 rounded-xl text-[10px] uppercase font-black tracking-wider cursor-pointer border-none flex items-center justify-center gap-1"
                                      >
                                        Flag Dispute
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}


              <div className="space-y-2 pt-1 select-none">
                <button
                  onClick={() => setNavTab('sell')}
                  className="w-full text-left py-2.5 px-3 bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/20 rounded-xl text-xs font-black text-amber-800 dark:text-amber-400 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Sell on TradeEase</span>
                  </div>
                  <span>→</span>
                </button>
              </div>

                </>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* 4. Floating Cart trigger button on Home Tab */}
      {navTab === 'home' && cartItemsCount > 0 && (
        <motion.button
          initial={{ scale: 0, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0, y: 50 }}
          onClick={() => setNavTab('cart')}
          className="absolute bottom-16 right-5 bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-full shadow-lg z-20 cursor-pointer flex items-center justify-center border border-white/10"
        >
          <ShoppingCart className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-900 font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-950">
            {cartItemsCount}
          </span>
        </motion.button>
      )}

      {/* 5. Bottom Navigation Bar */}
      <footer className="h-14 bg-white dark:bg-slate-950 border-t border-gray-100 dark:border-gray-800 flex items-center justify-around z-10 shrink-0">
        <button
          onClick={() => setNavTab('home')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 cursor-pointer transition-colors ${
            navTab === 'home' 
              ? 'text-emerald-600 dark:text-emerald-400 font-black' 
              : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'
          }`}
        >
          <Home className="w-5.5 h-5.5" />
          <span className="text-[9px]">Home</span>
        </button>

        <button
          onClick={() => setNavTab('categories')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 cursor-pointer transition-colors ${
            navTab === 'categories' 
              ? 'text-emerald-600 dark:text-emerald-400 font-black' 
              : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'
          }`}
        >
          <Grid className="w-5.5 h-5.5" />
          <span className="text-[9px]">Categories</span>
        </button>

        <button
          onClick={() => setNavTab('about')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 cursor-pointer transition-colors ${
            navTab === 'about' 
              ? 'text-emerald-600 dark:text-emerald-400 font-black' 
              : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'
          }`}
        >
          <Compass className="w-5.5 h-5.5" />
          <span className="text-[9px]">About Us</span>
        </button>

        <button
          onClick={() => setNavTab('cart')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 cursor-pointer transition-colors ${
            navTab === 'cart' 
              ? 'text-emerald-600 dark:text-emerald-400 font-black' 
              : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'
          }`}
        >
          <ShoppingCart className="w-5.5 h-5.5" />
          <span className="text-[9px]">Cart {cartItemsCount > 0 && `(${cartItemsCount})`}</span>
        </button>

        <button
          onClick={() => {
            setNavTab('profile');
            setProfileSubTab('info');
          }}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 cursor-pointer transition-colors relative ${
            navTab === 'profile' 
              ? 'text-emerald-600 dark:text-emerald-400 font-black' 
              : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'
          }`}
        >
          <div className="relative">
            {currentUser?.avatar ? (
              <img src={currentUser.avatar} alt="Me" referrerPolicy="no-referrer" className="w-6 h-6 rounded-full object-cover border border-emerald-500" />
            ) : currentUser ? (
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[8px] font-black border border-emerald-500">
                {(currentUser.name || 'M').trim().charAt(0).toUpperCase()}
              </div>
            ) : (
              <User className="w-5.5 h-5.5" />
            )}
            {statusToasts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full flex items-center justify-center animate-pulse" />
            )}
          </div>
          <span className="text-[9px]">Me</span>
        </button>
      </footer>

      {/* 6. Product Detail Bottom Modal Sheet Overlay */}
      <AnimatePresence>
        {selectedProduct && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-black z-30"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", damping: 30, stiffness: 220 }}
              className="absolute bottom-0 left-0 right-0 max-h-[92%] bg-white dark:bg-slate-950 rounded-t-3xl z-40 p-5 flex flex-col text-left overflow-y-auto"
            >
              {/* Pill Handle bar */}
              <div className="w-12 h-1 bg-gray-200 dark:bg-gray-800 rounded-full mx-auto mb-3 shrink-0" />
              
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-850">
                <div>
                  <span className="text-[9px] font-extrabold uppercase bg-emerald-500/10 px-2 py-0.5 text-emerald-600 rounded-md">
                    {selectedProduct.category}
                  </span>
                  <h3 className="font-extrabold text-sm text-gray-900 dark:text-white pt-1">
                    {selectedProduct.title}
                  </h3>
                </div>
                <button 
                  onClick={() => setSelectedProduct(null)}
                  className="p-1 rounded-full bg-gray-100 dark:bg-slate-800 hover:scale-95 text-gray-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Product Visual */}
              <div className="w-full h-44 bg-gray-50 rounded-2xl overflow-hidden mt-4 relative">
                <img
                  src={(selectedProduct.images && selectedProduct.images[activeGalleryImage]) || selectedProduct.image}
                  alt={selectedProduct.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                
                {/* Micro metrics */}
                <div className="absolute bottom-3 right-3 bg-slate-950/70 text-white rounded-lg p-1.5 flex items-center gap-1 font-bold text-[10px]">
                  {selectedProduct.reviewsCount > 0 ? (
                    <>
                      <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
                      <span>{selectedProduct.rating} / 5 ({selectedProduct.reviewsCount} reviews)</span>
                    </>
                  ) : (
                    <span className="text-emerald-400">No reviews yet</span>
                  )}
                </div>
              </div>

              {selectedProduct.images && selectedProduct.images.length > 1 && (
                <div className="flex gap-2 mt-2 overflow-x-auto">
                  {selectedProduct.images.map((img, idx) => (
                    <button key={img} type="button" onClick={() => setActiveGalleryImage(idx)}
                      className={`w-12 h-12 rounded-lg overflow-hidden border-2 shrink-0 cursor-pointer ${idx === activeGalleryImage ? 'border-emerald-500' : 'border-transparent'}`}>
                      <img src={img} alt={`${selectedProduct.title} ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Specs info */}
              <div className="space-y-3.5 mt-4">
                <div className="flex items-end gap-2.5">
                  <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                    {formatNaira(selectedProduct.price)}
                  </span>
                  <span className="text-xs text-gray-400 line-through pb-0.5">
                    {formatNaira(selectedProduct.originalPrice)}
                  </span>
                </div>

                {/* Logistics disclaimer */}
                <div className="p-3 bg-gray-50 dark:bg-slate-900 rounded-xl space-y-1 block border border-gray-150 dark:border-gray-800">
                  <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                    Vendor Logistics Center
                  </div>
                  <p className="text-xs font-bold text-slate-850 dark:text-slate-300">
                    {selectedProduct.vendorName}
                  </p>
                  <p className="text-[10px] text-gray-400 font-normal">
                    Fulfills within local state hubs via vetted dispatch networks after secure payment clearance.
                  </p>
                </div>

                {/* Description details */}
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                    Item Description
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-normal">
                    {selectedProduct.description}
                  </p>
                </div>

                {selectedProduct.specifications && Object.keys(selectedProduct.specifications).length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Product Details</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {Object.entries(selectedProduct.specifications).map(([key, value]) => (
                        <div key={key} className="bg-slate-50 dark:bg-slate-900 rounded-lg px-2.5 py-2">
                          <span className="block text-[8px] uppercase font-bold text-gray-400">{key}</span>
                          <span className="block text-[10px] font-semibold text-gray-700 dark:text-gray-200">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stock Level indicator */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-400 font-medium">Stock level:</span>
                  <span className={`font-bold ${selectedProduct.stock > 5 ? 'text-emerald-600' : 'text-amber-500'}`}>
                    {selectedProduct.stock > 500 ? "Digital Material (Unlimited)" : `${selectedProduct.stock} items remaining`}
                  </span>
                </div>
              </div>

              {/* Form trigger to add */}
              <div className="pt-5 mt-5 border-t border-gray-100 dark:border-gray-850">
                <button
                  onClick={() => { onAddToCart(selectedProduct); setSelectedProduct(null); }}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs tracking-wider uppercase shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add product to cart bag</span>
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 7. REAL PAYSTACK WALLET FUNDING */}
      <AnimatePresence>
        {isFundingOverlayOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.55 }} exit={{ opacity: 0 }} onClick={() => fundingStep !== 'processing' && setIsFundingOverlayOpen(false)} className="absolute inset-0 bg-slate-950 z-50" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-950 border-t border-gray-200 dark:border-gray-800 rounded-t-3xl z-50 p-5 space-y-4 max-h-[85%] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-base text-gray-900 dark:text-white">Fund Wallet</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Secure payment via Paystack.</p>
                </div>
                {fundingStep !== 'processing' && <button onClick={() => setIsFundingOverlayOpen(false)} className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>}
              </div>

              {fundingStep === 'input' && (
                <>
                  <div className="space-y-2">
                    <label htmlFor="tradeease-wallet-funding-amount" className="text-xs font-bold text-gray-600 dark:text-gray-300">
                      Amount to add
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-gray-500 pointer-events-none">₦</span>
                      <input
                        id="tradeease-wallet-funding-amount"
                        type="number"
                        inputMode="decimal"
                        min="100"
                        step="1"
                        value={fundingAmount}
                        onChange={(e) => setFundingAmount(e.target.value)}
                        onFocus={() => setFundingError('')}
                        placeholder="Enter amount"
                        autoFocus
                        className="relative z-10 pointer-events-auto select-text w-full pl-8 pr-3 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 text-base font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <p className="text-[10px] text-gray-400">Minimum funding amount: ₦100.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-900 text-center">
                    <span className="text-xs text-gray-500">Amount to pay</span>
                    <p className="text-2xl font-black text-emerald-600 mt-1">{formatNaira(Number(fundingAmount) || 0)}</p>
                  </div>
                  {fundingError && <p className="text-xs text-red-600 dark:text-red-400">{fundingError}</p>}
                  <button onClick={startWalletFunding} disabled={!fundingAmount || Number(fundingAmount) < 100} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl font-bold text-sm cursor-pointer disabled:cursor-not-allowed">
                    Continue to Paystack
                  </button>
                  <p className="text-[10px] text-center text-gray-400">You will complete the payment on Paystack. TradeEase credits your wallet only after the payment is verified.</p>
                </>
              )}

              {fundingStep === 'processing' && (
                <div className="py-8 text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
                  <h4 className="font-black text-sm text-gray-900 dark:text-white">Waiting for Paystack</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Complete the payment in the Paystack window. Your wallet will be credited after server verification.</p>
                </div>
              )}

              {fundingStep === 'success' && (
                <div className="py-6 text-center space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><Check className="w-8 h-8" /></div>
                  <div>
                    <h4 className="font-black text-base text-gray-900 dark:text-white">Wallet funded</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Your Paystack payment was verified and your wallet has been credited.</p>
                  </div>
                  <p className="text-2xl font-black text-emerald-600">{formatNaira(walletBalance)}</p>
                  <button onClick={() => { setIsFundingOverlayOpen(false); setFundingStep('input'); setFundingAmount(''); }} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm cursor-pointer">Done</button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Account Confirmation Modal */}
      <AnimatePresence>
        {showDeleteAccountModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => !deleteAccountLoading && setShowDeleteAccountModal(false)}
              className="absolute inset-0 bg-black z-50"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 220 }}
              className="absolute bottom-0 left-0 right-0 max-h-[92%] bg-white dark:bg-slate-950 rounded-t-3xl z-50 p-5 flex flex-col text-left overflow-y-auto"
            >
              <div className="w-12 h-1 bg-gray-200 dark:bg-gray-800 rounded-full mx-auto mb-3 shrink-0" />

              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-850">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  </div>
                  <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">
                    Delete Your Account
                  </h3>
                </div>
                <button
                  onClick={() => !deleteAccountLoading && setShowDeleteAccountModal(false)}
                  className="p-1 rounded-full bg-gray-100 dark:bg-slate-800 hover:scale-95 text-gray-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="pt-4 space-y-4">
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  This permanently deletes your TradeEase account, order history, vendor listings
                  (if you have a store), and support chat history. <span className="font-extrabold text-red-600 dark:text-red-400">This cannot be undone.</span>
                </p>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">
                    Type DELETE to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteAccountConfirmText}
                    onChange={(e) => setDeleteAccountConfirmText(e.target.value)}
                    placeholder="DELETE"
                    className="w-full border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-slate-900 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:border-red-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={deleteAccountPassword}
                    onChange={(e) => setDeleteAccountPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-slate-900 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:border-red-400"
                  />
                </div>

                {deleteAccountError && (
                  <p className="text-[10px] text-red-500 font-bold">{deleteAccountError}</p>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setShowDeleteAccountModal(false)}
                    disabled={deleteAccountLoading}
                    className="flex-1 py-3 bg-gray-100 dark:bg-slate-900 hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-xl text-[11px] font-bold uppercase tracking-wide cursor-pointer disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDeleteAccount}
                    disabled={deleteAccountLoading}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-[11px] font-bold uppercase tracking-wide cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {deleteAccountLoading ? 'Deleting…' : 'Permanently Delete'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
