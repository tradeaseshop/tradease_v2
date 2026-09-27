import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, X, LayoutDashboard, PlusCircle, Package, ShoppingCart, DollarSign, ArrowLeftRight,
  TrendingUp, Trash2, Edit2, ShieldAlert, CheckCircle, FileText, Smartphone, Shirt,
  BookOpen, Utensils, Sparkles, Home, User, AlertCircle, Truck, Printer, Lock, Shield, Terminal, Settings,
  Upload, Clock, XCircle, IdCard, MapPinned
} from 'lucide-react';
import { Product, Category, Order, UserSession } from '../types';
import { TRADEASE_CATALOG, CATALOG_BY_ID } from '../catalogTaxonomy';
import * as api from '../api';
import AccountSecurityPanel from './AccountSecurityPanel';
import Logo from './Logo';

// Helper Map for category icons
const IconMap: Record<string, React.ComponentType<any>> = {
  Smartphone,
  Shirt,
  BookOpen,
  Utensils,
  Home,
  Sparkles,
};

interface VendorModeProps {
  products: Product[];
  onAddProduct: (newProduct: Product) => Promise<Product>;
  onRemoveProduct: (productId: string) => void;
  onProductUpdated: (updatedProduct: Product) => void;
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
  onRoleToggle: () => void;
  location: { state: string; city: string };
  currentUser: UserSession | null;
  onUserUpdated: (updates: Partial<UserSession>) => void;
}

export default function VendorMode({
  products,
  onAddProduct,
  onRemoveProduct,
  onProductUpdated,
  orders,
  onUpdateOrderStatus,
  onRoleToggle,
  location,
  currentUser,
  onUserUpdated
}: VendorModeProps) {
  // Navigation: 'dashboard' | 'products' | 'add-product' | 'orders' | 'earnings' | 'profile'
  const [vendorTab, setVendorTab] = useState<'dashboard' | 'products' | 'add-product' | 'orders' | 'earnings' | 'profile'>('dashboard');
  const [accountToast, setAccountToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showAccountToast = (msg: string, type: 'success' | 'error') => {
    setAccountToast({ msg, type });
    setTimeout(() => setAccountToast(null), 3500);
  };
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // DELIVERI Partner Logistics Modals State
  const [activeWaybillOrder, setActiveWaybillOrder] = useState<Order | null>(null);
  const [activeRiderNotification, setActiveRiderNotification] = useState<{ orderId: string; trackingNumber: string } | null>(null);

  // ---------- KYC Verification State ----------
  const [kycStatus, setKycStatus] = useState<'Unverified' | 'Pending' | 'Verified' | 'Rejected'>('Unverified');
  const [kycDocuments, setKycDocuments] = useState<api.KycDocument[]>([]);
  const [kycLoading, setKycLoading] = useState(true);
  const [kycError, setKycError] = useState<string | null>(null);
  const [uploadingDocType, setUploadingDocType] = useState<'id' | 'address' | null>(null);
  const idFileInputRef = useRef<HTMLInputElement>(null);
  const addressFileInputRef = useRef<HTMLInputElement>(null);

  const refreshKyc = async () => {
    try {
      const data = await api.getMyKyc();
      setKycStatus(data.kycStatus);
      setKycDocuments(data.documents);
      setKycError(null);
    } catch (e: any) {
      setKycError(e.message || 'Could not load KYC verification status.');
    } finally {
      setKycLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) refreshKyc();
    else setKycLoading(false);
  }, [currentUser]);

  // ---------- Withdrawals ----------
  const [withdrawalBalance, setWithdrawalBalance] = useState<api.WithdrawalBalance | null>(null);
  const [myWithdrawals, setMyWithdrawals] = useState<api.Withdrawal[]>([]);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawBankName, setWithdrawBankName] = useState('');
  const [withdrawAccountNumber, setWithdrawAccountNumber] = useState('');
  const [withdrawAccountName, setWithdrawAccountName] = useState('');
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  const refreshWithdrawals = async () => {
    try {
      const [balance, history] = await Promise.all([api.getWithdrawalBalance(), api.getMyWithdrawals()]);
      setWithdrawalBalance(balance);
      setMyWithdrawals(history);
    } catch {
      // Balance card just shows a loading/blank state if this fails; not
      // critical enough to interrupt the rest of the dashboard.
    }
  };

  useEffect(() => {
    if (currentUser) refreshWithdrawals();
  }, [currentUser]);

  const handleRequestWithdrawal = async () => {
    setWithdrawError(null);
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) {
      setWithdrawError('Enter a valid amount.');
      return;
    }
    if (!withdrawBankName.trim() || !withdrawAccountNumber.trim() || !withdrawAccountName.trim()) {
      setWithdrawError('Bank name, account number, and account name are all required.');
      return;
    }
    setWithdrawSubmitting(true);
    try {
      await api.requestWithdrawal({
        amount,
        bankName: withdrawBankName.trim(),
        accountNumber: withdrawAccountNumber.trim(),
        accountName: withdrawAccountName.trim(),
      });
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      setWithdrawBankName('');
      setWithdrawAccountNumber('');
      setWithdrawAccountName('');
      await refreshWithdrawals();
    } catch (e: any) {
      setWithdrawError(e.message || 'Could not submit withdrawal request.');
    } finally {
      setWithdrawSubmitting(false);
    }
  };

  const handleKycFileSelected = async (docType: 'id' | 'address', file: File | undefined) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setKycError('File is too large — please keep it under 8MB.');
      return;
    }
    setKycError(null);
    setUploadingDocType(docType);
    try {
      await api.uploadKycDocument(docType, file);
      await refreshKyc();
    } catch (e: any) {
      setKycError(e.message || 'Upload failed. Please try again.');
    } finally {
      setUploadingDocType(null);
    }
  };

  const handleViewKycDocument = async (doc: api.KycDocument) => {
    try {
      const url = await api.getKycFileUrl(doc.id, false);
      window.open(url, '_blank');
    } catch (e: any) {
      setKycError(e.message || 'Could not open document.');
    }
  };

  // New Product Form State
  const [pTitle, setPTitle] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pOriginal, setPOriginal] = useState('');
  const [pCategory, setPCategory] = useState('electronics-gadgets');
  const [pSubcategory, setPSubcategory] = useState('phones-tablets');
  const [pDescription, setPDescription] = useState('');
  const [pStock, setPStock] = useState('10');
  const [formSuccess, setFormSuccess] = useState(false);
  const [isOptimizingWithAI, setIsOptimizingWithAI] = useState(false);
  const [optimizedSocialPitch, setOptimizedSocialPitch] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

  // Product photos — real files selected for upload, plus a local preview.
  // Actual upload to the server happens after the product itself is
  // created (it needs a real product ID to attach photos to).
  const MAX_PRODUCT_IMAGES = 10;
  const [pImageFiles, setPImageFiles] = useState<File[]>([]);
  const [pImagePreviews, setPImagePreviews] = useState<string[]>([]);
  const productImageInputRef = useRef<HTMLInputElement>(null);

  const handleProductImagesSelected = (fileList: FileList | null) => {
    if (!fileList) return;
    const incoming = Array.from(fileList).slice(0, MAX_PRODUCT_IMAGES - pImageFiles.length);
    if (incoming.length === 0) return;
    setPImageFiles((prev) => [...prev, ...incoming]);
    incoming.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => setPImagePreviews((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveSelectedImage = (index: number) => {
    setPImageFiles((prev) => prev.filter((_, i) => i !== index));
    setPImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Product specifications — vendor-defined key/value details (e.g. Brand,
  // Color, Warranty), shown to buyers on the product page.
  const [pSpecs, setPSpecs] = useState<Array<{ key: string; value: string }>>([{ key: '', value: '' }]);
  const updateSpecRow = (index: number, field: 'key' | 'value', value: string) => {
    setPSpecs((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };
  const addSpecRow = () => setPSpecs((prev) => [...prev, { key: '', value: '' }]);
  const removeSpecRow = (index: number) => setPSpecs((prev) => prev.filter((_, i) => i !== index));

  // Ebook files — a vendor can upload EPUB, PDF, or both, so a buyer can
  // pick their preferred format at checkout.
  const [epubFile, setEpubFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [ebookWatermark, setEbookWatermark] = useState('');

  const handleAIOptimize = async () => {
    if (!pTitle) {
      alert("Please enter a Product Name first to help the AI optimize.");
      return;
    }
    setIsOptimizingWithAI(true);
    setOptimizedSocialPitch('');
    try {
      const resp = await fetch(`${api.API_BASE}/api/gemini/vendor-optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: pTitle,
          description: pDescription,
          category: pCategory,
          price: pPrice || 'TBD'
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.optimizedTitle) setPTitle(data.optimizedTitle);
        if (data.optimizedDescription) setPDescription(data.optimizedDescription);
        if (data.socialMediaPitch) setOptimizedSocialPitch(data.socialMediaPitch);
      }
    } catch (err) {
      console.error("AI Optimization failed:", err);
    } finally {
      setIsOptimizingWithAI(false);
    }
  };

  // Preset quick-select image templates for easy vendor catalog generation
  // Calculations for Vendor stats
  // Total listed items
  const totalProductsCount = products.length;

  // Let's count total orders
  const totalOrdersCount = orders.length;

  // Earnings are computed from real delivered orders — the actual
  // commission-adjusted balance comes from the /withdrawals/balance API
  // (see withdrawalBalance state), this is just the raw pre-commission total.
  const completedOrders = orders.filter(o => o.status === 'Delivered');
  const deliveredRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!pTitle || !pPrice) return;
    if (pSubcategory === 'e-books' && !epubFile && !pdfFile) {
      setFormError('Upload at least one file (EPUB or PDF) for a digital product.');
      return;
    }

    setIsSubmittingProduct(true);
    try {
      const parsedPrice = parseFloat(pPrice) || 0;
      const parsedOriginal = parseFloat(pOriginal) || parsedPrice * 1.15;
      const specifications = pSpecs.reduce((acc, row) => {
        if (row.key.trim()) acc[row.key.trim()] = row.value.trim();
        return acc;
      }, {} as Record<string, string>);

      const newProdItem: Product = {
        id: `prod-${Date.now()}`,
        title: pTitle,
        price: parsedPrice,
        originalPrice: Math.round(parsedOriginal),
        image: '',
        rating: 0,
        reviewsCount: 0,
        category: pCategory,
        subcategory: pSubcategory,
        description: pDescription || "No product summary provided.",
        vendorName: currentUser ? currentUser.name : "Me (My Store Live)",
        vendorId: currentUser?.id || "vendor-self",
        isFeatured: false,
        stock: parseInt(pStock) || 5,
        specifications,
        digitalSpecification: pSubcategory === 'e-books' ? {
          fileType: pdfFile ? 'PDF' : 'EPUB',
          watermarkText: ebookWatermark || undefined,
        } : undefined,
      };

      // Step 1: create the product itself, so we have a real ID to attach
      // photos and ebook files to.
      let created = await onAddProduct(newProdItem);

      // Step 2: upload real product photos, if any were selected.
      if (pImageFiles.length > 0) {
        created = await api.uploadProductImages(created.id, pImageFiles);
      }

      // Step 3: upload the actual ebook file(s), if this is a digital product.
      if (pSubcategory === 'e-books' && (epubFile || pdfFile)) {
        created = await api.uploadProductEbookFiles(created.id, {
          epub: epubFile || undefined,
          pdf: pdfFile || undefined,
        });
      }

      onProductUpdated(created);
      setFormSuccess(true);
      setTimeout(() => {
        setFormSuccess(false);
        setPTitle('');
        setPCategory('electronics-gadgets');
        setPSubcategory('phones-tablets');
        setPPrice('');
        setPOriginal('');
        setPDescription('');
        setPStock('10');
        setPImageFiles([]);
        setPImagePreviews([]);
        setPSpecs([{ key: '', value: '' }]);
        setEpubFile(null);
        setPdfFile(null);
        setEbookWatermark('');
        setVendorTab('products'); // Redirect to products catalog
      }, 2000);
    } catch (err: any) {
      setFormError(err.message || 'Could not create product. Please try again.');
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const formatNaira = (amt: number) => {
    return `₦${amt.toLocaleString()}`;
  };

  return (
    <div className="h-full flex flex-col justify-between bg-slate-50 dark:bg-slate-900 overflow-hidden relative text-left">

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
      <header className="h-14 bg-amber-500 text-slate-950 px-4 flex items-center justify-between border-b border-amber-600 z-10 shrink-0">
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="p-1 rounded-lg hover:bg-amber-600 cursor-pointer text-slate-950"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex flex-col items-start select-none">
            <Logo size="sm" showTagline={false} animate={false} />
            <span className="text-[8px] text-amber-950 font-black uppercase tracking-wider pl-1 font-mono leading-none mt-0.5 animate-pulse">
              ● Vendor Dashboard
            </span>
          </div>
        </div>

        {/* Switch back to Buyer view — only relevant while browsing without
            an account; a signed-in vendor account stays in the vendor UI. */}
        {!currentUser && (
          <button
            onClick={onRoleToggle}
            className="flex items-center gap-1 bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-[10px] py-1.5 px-3 rounded-lg shadow-sm cursor-pointer transition-all"
          >
            <ArrowLeftRight className="w-3 h-3 text-amber-500" />
            <span>Switch to Buyer UI</span>
          </button>
        )}
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
                    <span className="text-[9px] text-amber-500 font-extrabold uppercase tracking-wider pl-1 font-mono">
                      ● Vendor HQ Enabled
                    </span>
                  </div>
                  <button 
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Central Links */}
                <div className="space-y-2">
                  <h4 className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider pl-1.55">
                    Hub Controller
                  </h4>
                  <div className="space-y-1">
                    <button
                      onClick={() => { setVendorTab('dashboard'); setIsDrawerOpen(false); }}
                      className={`w-full text-left py-2 px-3 rounded-lg text-xs font-bold flex items-center gap-2.5 cursor-pointer ${
                        vendorTab === 'dashboard'
                          ? 'bg-amber-500 text-slate-900'
                          : 'hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-750 dark:text-gray-300'
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Console Overview</span>
                    </button>

                    <button
                      onClick={() => { setVendorTab('products'); setIsDrawerOpen(false); }}
                      className={`w-full text-left py-2 px-3 rounded-lg text-xs font-bold flex items-center gap-2.5 cursor-pointer ${
                        vendorTab === 'products'
                          ? 'bg-amber-500 text-slate-900'
                          : 'hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-750 dark:text-gray-300'
                      }`}
                    >
                      <Package className="w-4 h-4" />
                      <span>My Products ({totalProductsCount})</span>
                    </button>

                    <button
                      onClick={() => { setVendorTab('add-product'); setIsDrawerOpen(false); }}
                      className={`w-full text-left py-2 px-3 rounded-lg text-xs font-bold flex items-center gap-2.5 cursor-pointer ${
                        vendorTab === 'add-product'
                          ? 'bg-amber-500 text-slate-900'
                          : 'hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-750 dark:text-gray-400'
                      }`}
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Add New Product</span>
                    </button>

                    <button
                      onClick={() => { setVendorTab('orders'); setIsDrawerOpen(false); }}
                      className={`w-full text-left py-2 px-3 rounded-lg text-xs font-bold flex items-center gap-2.5 cursor-pointer ${
                        vendorTab === 'orders'
                          ? 'bg-amber-500 text-slate-900'
                          : 'hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-750 dark:text-gray-300'
                      }`}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Live Orders ({totalOrdersCount})</span>
                    </button>

                    <button
                      onClick={() => { setVendorTab('earnings'); setIsDrawerOpen(false); }}
                      className={`w-full text-left py-2 px-3 rounded-lg text-xs font-bold flex items-center gap-2.5 cursor-pointer ${
                        vendorTab === 'earnings'
                          ? 'bg-amber-500 text-slate-900'
                          : 'hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-750 dark:text-gray-300'
                      }`}
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>Naira Earnings</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Back to buyer view — only relevant while browsing without
                  an account. */}
              {!currentUser && (
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => { onRoleToggle(); setIsDrawerOpen(false); }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Home className="w-4 h-4" />
                    <span>Exit to Buyers Space</span>
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 3. Main Workspace Tab content */}
      <div className="flex-1 overflow-y-auto min-h-0 relative">
        <AnimatePresence mode="wait">
          
          {/* V-TAB 1: SYSTEM DASHBOARD OVERVIEW */}
          {vendorTab === 'dashboard' && (
            <motion.div
              key="v-dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 space-y-4"
            >
              {/* Stats Summary cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white dark:bg-slate-950 border border-gray-150 dark:border-gray-800 rounded-xl space-y-1 shadow-xs">
                  <div className="flex items-center justify-between text-gray-450 text-[10px] font-extrabold uppercase">
                    <span>Products Listed</span>
                    <Package className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <p className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                    {totalProductsCount}
                  </p>
                  <span className="text-[9px] text-gray-400 font-medium block">Active in buyers feed</span>
                </div>

                <div className="p-3 bg-white dark:bg-slate-950 border border-gray-150 dark:border-gray-800 rounded-xl space-y-1 shadow-xs">
                  <div className="flex items-center justify-between text-gray-450 text-[10px] font-extrabold uppercase">
                    <span>Active Orders</span>
                    <ShoppingCart className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <p className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                    {totalOrdersCount}
                  </p>
                  <span className="text-[9px] text-gray-400 font-medium block">Required fulfillment</span>
                </div>

                {/* Real Payout Balance card, with a Request Withdrawal action */}
                <div className="col-span-2 p-4 bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl text-white space-y-1.5 shadow-sm relative overflow-hidden border border-slate-800">
                  <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-450">
                    <TrendingUp className="w-6 h-6 stroke-[2]" />
                  </div>
                  
                  <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest block">
                    Available Payout Balance
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black">
                      {withdrawalBalance ? formatNaira(withdrawalBalance.availableBalance) : '—'}
                    </span>
                  </div>
                  <p className="text-[9.5px] text-slate-400 leading-normal">
                    Earnings from delivered orders, after platform commission, not yet withdrawn.
                  </p>
                  <button
                    onClick={() => setShowWithdrawModal(true)}
                    disabled={!withdrawalBalance || withdrawalBalance.availableBalance <= 0}
                    className="mt-1.5 w-full py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-extrabold text-[11px] rounded-lg cursor-pointer transition-all"
                  >
                    Request Withdrawal
                  </button>
                </div>
              </div>

              {/* Withdrawal history */}
              {myWithdrawals.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-0.5">
                    Withdrawal Requests
                  </h4>
                  <div className="bg-white dark:bg-slate-950 border border-gray-150 dark:border-gray-800/80 rounded-2xl divide-y divide-gray-100 dark:divide-gray-900 overflow-hidden text-xs">
                    {myWithdrawals.map((w) => (
                      <div key={w.id} className="p-3 flex items-center justify-between">
                        <div>
                          <p className="font-extrabold text-gray-900 dark:text-white">{formatNaira(w.amount)}</p>
                          <span className="text-[9px] text-gray-400">
                            {new Date(w.requestedAt).toLocaleDateString()} • {w.bankName}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${
                            w.status === 'Paid'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                              : w.status === 'Approved'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                              : w.status === 'Rejected'
                              ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                          }`}
                        >
                          {w.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* RECENT ORDERS LIST */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between pl-0.5">
                  <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
                    Recent Customer Receipts
                  </h3>
                  <button 
                    onClick={() => setVendorTab('orders')}
                    className="text-[10px] font-extrabold text-amber-500 uppercase hover:underline"
                  >
                    Manage Orders
                  </button>
                </div>

                {orders.length === 0 ? (
                  <div className="p-6 bg-white dark:bg-slate-950 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 text-center text-xs text-gray-400 dark:text-gray-500">
                    <AlertCircle className="w-6 h-6 mx-auto text-gray-300 dark:text-gray-700 mb-1" />
                    <span>No customer orders recorded yet. Sell an item in Buyer mode!</span>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {orders.slice(0, 3).map((order) => (
                      <div 
                        key={`recent-od-${order.id}`}
                        className="bg-white dark:bg-slate-950 p-3 rounded-xl border border-gray-150 dark:border-gray-800 flex items-center justify-between"
                      >
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-extrabold text-gray-800 dark:text-white">
                            {order.buyerName}
                          </h4>
                          <p className="text-[10px] text-gray-400 font-medium">
                            {order.city} • {formatNaira(order.totalAmount)}
                          </p>
                        </div>
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md ${
                          order.status === 'Pending' ? 'bg-amber-100 text-amber-600' :
                          order.status === 'Processing' ? 'bg-blue-100 text-blue-600' :
                          order.status === 'Shipped' ? 'bg-purple-100 text-purple-600' :
                          'bg-emerald-100 text-emerald-600'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* V-TAB 2: LISTED PRODUCTS MANAGEMENT */}
          {vendorTab === 'products' && (
            <motion.div
              key="v-products"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">
                  Your Stock Inventory
                </h2>
                <button
                  onClick={() => setVendorTab('add-product')}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>List New</span>
                </button>
              </div>

              {products.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-slate-950 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                  <Package className="w-9 h-9 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 dark:text-gray-500">No listed products currently. Add some right now!</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {products.map((prod) => (
                    <div
                      key={`vendor-prod-${prod.id}`}
                      className="p-2.5 bg-white dark:bg-slate-950 border border-gray-150 dark:border-gray-850 rounded-xl flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <img
                          src={prod.image}
                          alt={prod.title}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-lg object-cover bg-gray-50 shrink-0"
                        />
                        <div className="truncate text-left">
                          <h4 className="text-xs font-extrabold text-gray-800 dark:text-slate-100 truncate">
                            {prod.title}
                          </h4>
                          <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                            {formatNaira(prod.price)}
                          </span>
                        </div>
                      </div>

                      {/* Controls and adjustments */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Stock indicator badge */}
                        <div className="text-right mr-1.5">
                          <span className="text-[9px] text-gray-400 block uppercase font-bold">Qty Available</span>
                          <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                            {prod.stock > 100 ? '99+' : prod.stock}
                          </span>
                        </div>

                        {/* Trash to remove listed item */}
                        <button
                          onClick={() => onRemoveProduct(prod.id)}
                          className="p-1 px-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-neutral-50 dark:hover:bg-slate-900 cursor-pointer"
                          title="Unlist Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* V-TAB 3: ADD NATIVE PRODUCT FORM */}
          {vendorTab === 'add-product' && (
            <motion.div
              key="v-add-product"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 space-y-4"
            >
              <h2 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">
                Create Market Listing
              </h2>

              {formSuccess ? (
                <div className="py-12 bg-white dark:bg-slate-950 rounded-2xl border border-emerald-500/20 text-center space-y-3 shadow-md">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/35 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
                    <CheckCircle className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <h4 className="font-extrabold text-sm">Product Listed!</h4>
                  <p className="text-xs text-gray-400 max-w-xs mx-auto px-4">
                    Taking you back to your catalog...
                  </p>
                </div>
              ) : (
                <form onSubmit={handleCreateProduct} className="bg-white dark:bg-slate-950 rounded-2xl p-4 border border-gray-150 dark:border-gray-800 space-y-3.5 text-left">
                  
                  {formError && (
                    <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30 rounded-xl text-[11px] text-red-600 dark:text-red-400">
                      {formError}
                    </div>
                  )}

                  {/* Field 1: Title */}
                  <div>
                    <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-1">
                      Product Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Adidas Native Slippers"
                      value={pTitle}
                      onChange={(e) => setPTitle(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 dark:text-white"
                    />
                  </div>

                  {/* Dual row pricing & inventory */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-1">
                        Retail Price (₦)
                      </label>
                      <input
                        type="number"
                        required
                        placeholder="Price in Naira"
                        value={pPrice}
                        onChange={(e) => setPPrice(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-1">
                        Original Price (₦)
                      </label>
                      <input
                        type="number"
                        placeholder="Before Discount"
                        value={pOriginal}
                        onChange={(e) => setPOriginal(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Category select and stock */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-1">
                        Department
                      </label>
                      <select
                        value={pCategory}
                        onChange={(e) => { const next = e.target.value; setPCategory(next); setPSubcategory(CATALOG_BY_ID[next]?.subcategories[0]?.id || ''); }}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 dark:text-white"
                      >
                        {TRADEASE_CATALOG.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-1">Subcategory</label>
                      <select
                        value={pSubcategory}
                        required
                        onChange={(e) => setPSubcategory(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 dark:text-white"
                      >
                        {(CATALOG_BY_ID[pCategory]?.subcategories || []).map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-1">
                        Stock Volume
                      </label>
                      <input
                        type="number"
                        required
                        value={pStock}
                        onChange={(e) => setPStock(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Real product photo upload — up to 10 real photos */}
                  <div className="space-y-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-gray-150 dark:border-gray-850">
                    <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block">
                      Product Photos ({pImagePreviews.length}/{MAX_PRODUCT_IMAGES})
                    </label>

                    <div className="grid grid-cols-4 gap-2">
                      {pImagePreviews.map((src, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 group">
                          <img src={src} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveSelectedImage(idx)}
                            className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 text-white rounded-full flex items-center justify-center cursor-pointer"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                      {pImagePreviews.length < MAX_PRODUCT_IMAGES && (
                        <button
                          type="button"
                          onClick={() => productImageInputRef.current?.click()}
                          className="aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-amber-500 hover:text-amber-500 cursor-pointer"
                        >
                          <Upload className="w-4 h-4" />
                          <span className="text-[8px] font-bold">Add</span>
                        </button>
                      )}
                    </div>
                    <input
                      ref={productImageInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={(e) => handleProductImagesSelected(e.target.files)}
                      className="hidden"
                    />
                    <p className="text-[9px] text-gray-400">First photo becomes the cover image. JPG, PNG, or WEBP.</p>
                  </div>

                  {/* Product specifications — vendor-defined details shown to buyers */}
                  <div className="space-y-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-gray-150 dark:border-gray-850">
                    <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block">
                      Product Details
                    </label>
                    <div className="space-y-1.5">
                      {pSpecs.map((row, idx) => (
                        <div key={idx} className="flex gap-1.5">
                          <input
                            type="text"
                            placeholder="e.g. Brand"
                            value={row.key}
                            onChange={(e) => updateSpecRow(idx, 'key', e.target.value)}
                            className="w-1/3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 rounded-lg px-2 py-1.5 text-[11px] focus:ring-1 focus:ring-amber-500 dark:text-white"
                          />
                          <input
                            type="text"
                            placeholder="e.g. Samsung"
                            value={row.value}
                            onChange={(e) => updateSpecRow(idx, 'value', e.target.value)}
                            className="flex-1 bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 rounded-lg px-2 py-1.5 text-[11px] focus:ring-1 focus:ring-amber-500 dark:text-white"
                          />
                          {pSpecs.length > 1 && (
                            <button type="button" onClick={() => removeSpecRow(idx)} className="text-gray-400 hover:text-red-500 cursor-pointer px-1">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={addSpecRow}
                      className="text-[10px] font-bold text-amber-600 hover:text-amber-700 cursor-pointer"
                    >
                      + Add another detail
                    </button>
                  </div>

                  {/* Ebook file upload — real EPUB/PDF files, for digital products */}
                  {pSubcategory === 'e-books' && (
                    <div className="bg-purple-500/5 dark:bg-purple-950/20 border border-purple-500/20 rounded-2xl p-4 space-y-3.5 text-left">
                      <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                        <Lock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <h4 className="text-[11px] font-black uppercase tracking-wider">
                          Ebook File
                        </h4>
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">
                        Upload EPUB, PDF, or both — buyers choose their preferred format at checkout.
                      </p>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] font-bold text-gray-400 dark:text-gray-500 block mb-1">EPUB FILE</label>
                          <label className="flex flex-col items-center justify-center py-3 bg-white hover:bg-gray-50 dark:bg-slate-950 dark:hover:bg-slate-900 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer text-center">
                            <span className="text-[10px] font-extrabold text-purple-600 dark:text-purple-400 px-2 truncate max-w-full">
                              {epubFile ? epubFile.name : 'Choose .epub'}
                            </span>
                            <input
                              type="file"
                              accept=".epub,application/epub+zip"
                              onChange={(e) => setEpubFile(e.target.files?.[0] || null)}
                              className="hidden"
                            />
                          </label>
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-gray-400 dark:text-gray-500 block mb-1">PDF FILE</label>
                          <label className="flex flex-col items-center justify-center py-3 bg-white hover:bg-gray-50 dark:bg-slate-950 dark:hover:bg-slate-900 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer text-center">
                            <span className="text-[10px] font-extrabold text-purple-600 dark:text-purple-400 px-2 truncate max-w-full">
                              {pdfFile ? pdfFile.name : 'Choose .pdf'}
                            </span>
                            <input
                              type="file"
                              accept=".pdf,application/pdf"
                              onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-gray-400 dark:text-gray-500 block mb-1">
                          WATERMARK TEXT (optional)
                        </label>
                        <input
                          type="text"
                          value={ebookWatermark}
                          onChange={(e) => setEbookWatermark(e.target.value)}
                          placeholder="e.g. Licensed to the buyer's email"
                          className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-gray-850 dark:text-slate-100"
                        />
                      </div>
                    </div>
                  )}

                  {/* AI Optimization Assist tool */}
                  <div className="bg-gradient-to-r from-amber-500/10 to-emerald-500/10 border border-amber-500/20 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                        <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                        <span className="text-[11px] font-black uppercase tracking-wider">
                          TradeEase AI Listing Assistant
                        </span>
                      </div>
                      <span className="text-[8px] bg-amber-500/20 text-text-amber-700 dark:text-amber-300 font-extrabold px-1.5 py-0.5 rounded uppercase">
                        Gemini-3.5
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-snug">
                      Analyze title & pricing to craft high-conversion titles, detailed benefit bullets, and standard social media pitches automatically.
                    </p>
                    <button
                      type="button"
                      disabled={isOptimizingWithAI}
                      onClick={handleAIOptimize}
                      className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 active:scale-95 text-slate-950 font-black text-[10px] rounded-lg tracking-wider uppercase cursor-pointer flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                    >
                      {isOptimizingWithAI ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                          AI is Writing Pristine Copy...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          Rewrite & Optimize Listing with AI
                        </>
                      )}
                    </button>

                    {optimizedSocialPitch && (
                      <div className="mt-2 bg-slate-950 p-2.5 rounded-lg border border-emerald-500/30 font-mono text-[9px] text-emerald-400 leading-relaxed shadow-inner">
                        <span className="text-[8px] text-gray-500 font-bold block mb-1">RECOMMENDED INSTA / WHATSAPP STATUS PITCH:</span>
                        "{optimizedSocialPitch}"
                      </div>
                    )}
                  </div>

                  {/* Plain Text Description */}
                  <div>
                    <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-1">
                      Listing Summary / Specs
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Input rich detail so buyers buy quickly."
                      value={pDescription}
                      onChange={(e) => setPDescription(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 dark:text-white"
                    />
                  </div>

                  {/* Submit product button */}
                  <button
                    type="submit"
                    disabled={isSubmittingProduct}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 font-extrabold text-slate-950 rounded-xl text-xs uppercase tracking-wider shadow-sm cursor-pointer"
                  >
                    {isSubmittingProduct ? 'Publishing...' : 'Publish Product'}
                  </button>

                </form>
              )}
            </motion.div>
          )}

          {/* V-TAB 4: LIVE DELIVERIES & ORDERS LOG PANEL */}
          {vendorTab === 'orders' && (
            <motion.div
              key="v-orders"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 space-y-4 text-left"
            >
              <div className="flex items-center justify-between pb-1">
                <h2 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">
                  Logistics & Orders Pool
                </h2>
                <span className="text-[10px] text-gray-400 font-bold uppercase">Consolidated</span>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-slate-950 rounded-xl border border-dashed border-gray-200 dark:border-gray-850">
                  <ShoppingCart className="w-9 h-9 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    No active buy transactions recorded for processing. Keep this panel open!
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                  {[...orders].reverse().map((od) => (
                    <div
                      key={`vendor-od-item-${od.id}`}
                      className="p-3.5 bg-white dark:bg-slate-950 rounded-xl border border-gray-150 dark:border-gray-800 space-y-3 shadow-xs"
                    >
                      {/* header details */}
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-extrabold text-gray-400 font-mono">ORDER ID: {od.id}</span>
                          <span className="text-[9px] block text-gray-400">{new Date(od.date).toLocaleDateString()}</span>
                        </div>
                        
                        {/* Read-only tracking badge according to Item 6 */}
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] font-black uppercase rounded px-2 py-0.5 ${
                            od.status === 'Pending' 
                              ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400'
                              : od.status === 'Processing'
                                ? 'bg-sky-50 text-sky-600 dark:bg-sky-950/20 dark:text-sky-450'
                                : od.status === 'Shipped'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400'
                                  : od.status === 'Delivered'
                                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450'
                                    : 'bg-rose-50 text-rose-600 dark:bg-rose-950/20'
                          }`}>
                            {od.status}
                          </span>
                        </div>
                      </div>

                      {/* Items loop list */}
                      <div className="space-y-1.5 pl-1">
                        {od.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs">
                            <span className="text-gray-650 dark:text-gray-300 truncate max-w-[200px]">
                              {it.productTitle} <span className="text-[10px] text-gray-400 font-bold">x{it.quantity}</span>
                            </span>
                            <span className="font-bold">{formatNaira(it.price * it.quantity)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Shipping information details & DELIVERI Sister Carrier Panel */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-left">
                        {/* Masked private details according to Item 6 */}
                        <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl text-[10.5px] text-gray-600 dark:text-gray-400 space-y-1 border border-gray-155 dark:border-gray-800">
                          <p className="font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[8px] font-mono">
                            Customer Location Target (Masked)
                          </p>
                          <p className="font-bold text-gray-900 dark:text-gray-250">
                            {od.buyerName} ({od.buyerPhone ? `${od.buyerPhone.substring(0, 6)}***${od.buyerPhone.slice(-3)}` : 'Masked'})
                          </p>
                          <p className="font-medium text-[10px] leading-normal">[Address Masked for Privacy], {od.city}, {od.state} State Hub</p>
                          <p className="text-[8.5px] text-gray-400 italic">Full address and phone confidential to Admin & DELIVERI courier</p>
                        </div>

                        <div className="bg-sky-50/50 dark:bg-sky-950/15 p-3 rounded-xl text-[10.5px] text-sky-950 dark:text-sky-350 space-y-1.5 border border-sky-100 dark:border-sky-900/20">
                          <div className="flex items-center justify-between gap-1 flex-wrap">
                            <span className="text-[8.5px] bg-sky-500/10 text-sky-600 dark:text-sky-400 font-extrabold px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">
                              DELIVERI Logistics Partner
                            </span>
                            <span className="font-mono text-[10.5px] text-sky-600 dark:text-sky-450 font-black">
                              {od.deliveriTrackingNumber || 'DV-381-8172'}
                            </span>
                          </div>
                          
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-normal">
                            Speed: <strong className="text-gray-800 dark:text-gray-200">{od.shippingMethod || 'DELIVERI Economy Standard'}</strong>
                          </p>

                          <div className="flex gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setActiveWaybillOrder(od)}
                              className="flex-1 py-1.5 px-2.5 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-[9.5px] uppercase tracking-wide rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>View Waybill</span>
                            </button>

                            <div className="flex-1 text-[9px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 uppercase rounded-lg flex items-center justify-center font-mono">
                              ● DELIVERI Managed
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="text-right text-xs pt-1.5 border-t border-gray-100 dark:border-gray-900">
                        <span className="text-gray-400">Order Payout Value: </span>
                        <span className="font-black text-amber-500">{formatNaira(od.totalAmount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* V-TAB 5: DETAILED EARNINGS HISTOGRAMS */}
          {vendorTab === 'earnings' && (
            <motion.div
              key="v-earnings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 space-y-4 text-left"
            >
              <h2 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">
                Market revenue log
              </h2>

              <div className="p-4 bg-slate-950 text-white rounded-2xl space-y-1.5 shadow-sm">
                <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wide">Gross Earnings</span>
                <p className="text-2xl font-black text-amber-400">
                  {withdrawalBalance ? formatNaira(withdrawalBalance.grossEarnings) : formatNaira(deliveredRevenue)}
                </p>
                <p className="text-[10px] text-gray-400">Total earned from delivered orders, before commission.</p>
              </div>

              {/* Chart simulation SVG */}
              <div className="p-4 bg-white dark:bg-slate-950 border border-gray-150 dark:border-gray-850 rounded-2xl space-y-3.5">
                <h3 className="text-xs font-black uppercase tracking-wider">Weekly performance</h3>
                
                {/* Hand crafted smooth chart line */}
                <div className="relative h-20 w-full">
                  <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.3"/>
                        <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0"/>
                      </linearGradient>
                    </defs>
                    {/* Grid Lines */}
                    <line x1="0" y1="10" x2="100" y2="10" stroke="#808080" strokeWidth="0.1" strokeDasharray="1,1" />
                    <line x1="0" y1="20" x2="100" y2="20" stroke="#808080" strokeWidth="0.1" strokeDasharray="1,1" />
                    {/* Area under curve */}
                    <path d="M0 30 Q 20 20, 35 15 T 70 8 T 100 3 L 100 30 L 0 30 Z" fill="url(#chart-grad)" />
                    {/* Line path */}
                    <path d="M0 30 Q 20 20, 35 15 T 70 8 T 100 3" fill="none" stroke="#F59E0B" strokeWidth="1.2" strokeLinecap="round" />
                    {/* Nodes pointer */}
                    <circle cx="35" cy="15" r="1.5" fill="#F59E0B" />
                    <circle cx="70" cy="8" r="1.5" fill="#F59E0B" />
                    <circle cx="100" cy="3" r="1.5" fill="#F59E0B" />
                  </svg>
                </div>
                
                <div className="flex items-center justify-between text-[9px] font-extrabold text-gray-500 uppercase tracking-widest px-1">
                  <span>Mon</span>
                  <span>Wed</span>
                  <span>Fri</span>
                  <span>Today</span>
                </div>
              </div>

              {/* Informative advice */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 rounded-xl flex gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-800 dark:text-amber-400 font-normal leading-relaxed">
                  Payout requests are processed automatically on Friday afternoon to commercial bank accounts across Nigeria with zero transfer fees.
                </p>
              </div>
            </motion.div>
          )}

          {/* V-TAB 6: VENDOR PROFILE / HUB INFO */}
          {vendorTab === 'profile' && (
            <div className="p-4 space-y-4 text-left">
              <div className="p-4 bg-white dark:bg-slate-950 border border-gray-150 dark:border-gray-800 rounded-2xl flex items-center gap-3 shadow-xs">
                {currentUser && currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-full object-cover border-2 border-amber-500 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-amber-500 text-slate-900 flex items-center justify-center font-black text-lg shadow-sm shrink-0">
                    {currentUser ? currentUser.name.charAt(0).toUpperCase() : "V"}
                  </div>
                )}
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">
                    {currentUser ? currentUser.name : "My Vendor Hub Store"}
                  </h3>
                  <p className="text-[10px] text-emerald-600 font-bold">{location.city}, {location.state} State</p>
                  {kycStatus === 'Verified' && (
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-600 px-2.5 py-0.5 rounded-md font-bold uppercase mt-1 inline-flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Verified Seller Account
                    </span>
                  )}
                  {kycStatus === 'Pending' && (
                    <span className="text-[9px] bg-amber-500/10 text-amber-600 px-2.5 py-0.5 rounded-md font-bold uppercase mt-1 inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Verification Pending Review
                    </span>
                  )}
                  {kycStatus === 'Rejected' && (
                    <span className="text-[9px] bg-rose-500/10 text-rose-600 px-2.5 py-0.5 rounded-md font-bold uppercase mt-1 inline-flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> Verification Rejected
                    </span>
                  )}
                  {kycStatus === 'Unverified' && (
                    <span className="text-[9px] bg-gray-500/10 text-gray-500 px-2.5 py-0.5 rounded-md font-bold uppercase mt-1 inline-flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" /> Not Yet Verified
                    </span>
                  )}
                </div>
              </div>

              {/* Profile, password, avatar, email verification, and 2FA */}
              {currentUser && (
                <AccountSecurityPanel
                  currentUser={currentUser}
                  onUserUpdated={onUserUpdated}
                  onToast={showAccountToast}
                  showStoreLogo
                />
              )}

              {/* KYC Verification Card */}
              <div className="p-4 bg-white dark:bg-slate-950 border border-gray-150 dark:border-gray-800 rounded-2xl space-y-3.5 text-xs">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-500" />
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">
                    Identity Verification (KYC)
                  </span>
                </div>

                {kycStatus === 'Rejected' && kycDocuments.some(d => d.status === 'Rejected') && (
                  <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[10px] text-rose-600 dark:text-rose-400">
                    {kycDocuments.filter(d => d.status === 'Rejected').map(d => (
                      <p key={d.id}>
                        <strong className="uppercase">{d.docType === 'id' ? 'ID Document' : 'Address Document'}:</strong> {d.rejectionReason || 'Rejected — please re-upload.'}
                      </p>
                    ))}
                  </div>
                )}
                {kycError && (
                  <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[10px] text-rose-600 dark:text-rose-400">
                    {kycError}
                  </div>
                )}
                {kycStatus === 'Verified' && (
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] text-emerald-600 dark:text-emerald-400">
                    Your account is fully verified. Thank you for completing KYC.
                  </div>
                )}

                {/* ID Document row */}
                {(() => {
                  const idDoc = kycDocuments.find(d => d.docType === 'id');
                  return (
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-850 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <IdCard className="w-4 h-4 text-gray-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 dark:text-white">Government-Issued ID</p>
                          {idDoc ? (
                            <button onClick={() => handleViewKycDocument(idDoc)} className="text-[10px] text-amber-600 hover:underline truncate cursor-pointer">
                              {idDoc.originalFileName} · {idDoc.status}
                            </button>
                          ) : (
                            <p className="text-[10px] text-gray-400">National ID, driver's license, or passport</p>
                          )}
                        </div>
                      </div>
                      <input
                        ref={idFileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        className="hidden"
                        onChange={(e) => handleKycFileSelected('id', e.target.files?.[0])}
                      />
                      <button
                        onClick={() => idFileInputRef.current?.click()}
                        disabled={uploadingDocType === 'id'}
                        className="shrink-0 py-1.5 px-2.5 bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-60 text-amber-600 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3 h-3" />
                        {uploadingDocType === 'id' ? 'Uploading…' : idDoc ? 'Replace' : 'Upload'}
                      </button>
                    </div>
                  );
                })()}

                {/* Address Document row */}
                {(() => {
                  const addressDoc = kycDocuments.find(d => d.docType === 'address');
                  return (
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-850 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <MapPinned className="w-4 h-4 text-gray-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 dark:text-white">Proof of Address</p>
                          {addressDoc ? (
                            <button onClick={() => handleViewKycDocument(addressDoc)} className="text-[10px] text-amber-600 hover:underline truncate cursor-pointer">
                              {addressDoc.originalFileName} · {addressDoc.status}
                            </button>
                          ) : (
                            <p className="text-[10px] text-gray-400">Utility bill, bank statement, or CAC certificate</p>
                          )}
                        </div>
                      </div>
                      <input
                        ref={addressFileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        className="hidden"
                        onChange={(e) => handleKycFileSelected('address', e.target.files?.[0])}
                      />
                      <button
                        onClick={() => addressFileInputRef.current?.click()}
                        disabled={uploadingDocType === 'address'}
                        className="shrink-0 py-1.5 px-2.5 bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-60 text-amber-600 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3 h-3" />
                        {uploadingDocType === 'address' ? 'Uploading…' : addressDoc ? 'Replace' : 'Upload'}
                      </button>
                    </div>
                  );
                })()}

                <p className="text-[9px] text-gray-400 leading-relaxed">
                  Accepted formats: JPG, PNG, or PDF, up to 8MB each. Your documents are only visible to you and the TradeEase compliance team.
                </p>
              </div>

              <div className="p-4 bg-white dark:bg-slate-950 border border-gray-150 dark:border-gray-800 rounded-2xl space-y-3.5 text-xs">
                <div className="space-y-1.5">
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Seller Guidelines</span>
                  <p className="text-gray-500 dark:text-gray-400 leading-normal font-normal">
                    Fulfilling orders quickly and keeping your listings accurate helps your store earn better reviews over time.
                  </p>
                </div>
              </div>
            </div>
          )}

        </AnimatePresence>
      </div>

      {/* 4. Bottom Navbar custom tabs for easy console switches! */}
      <footer className="h-14 bg-white dark:bg-slate-950 border-t border-gray-100 dark:border-gray-850 flex items-center justify-around z-10 shrink-0">
        <button
          onClick={() => setVendorTab('dashboard')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 cursor-pointer transition-all ${
            vendorTab === 'dashboard' 
              ? 'text-amber-500 font-extrabold' 
              : 'text-gray-400 dark:text-gray-500 hover:text-amber-400'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[9px]">Dashboard</span>
        </button>

        <button
          onClick={() => setVendorTab('products')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 cursor-pointer transition-all ${
            vendorTab === 'products' 
              ? 'text-amber-500 font-extrabold' 
              : 'text-gray-400 dark:text-gray-500 hover:text-amber-400'
          }`}
        >
          <Package className="w-5 h-5" />
          <span className="text-[9px]">My Stock</span>
        </button>

        <button
          onClick={() => setVendorTab('add-product')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 cursor-pointer transition-all ${
            vendorTab === 'add-product' 
              ? 'text-amber-500 font-extrabold' 
              : 'text-gray-400 dark:text-gray-500 hover:text-amber-400'
          }`}
        >
          <PlusCircle className="w-5 h-5" />
          <span className="text-[9px]">Add SKU</span>
        </button>

        <button
          onClick={() => setVendorTab('orders')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 cursor-pointer transition-all ${
            vendorTab === 'orders' 
              ? 'text-amber-500 font-extrabold' 
              : 'text-gray-400 dark:text-gray-500 hover:text-amber-400'
          }`}
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="text-[9px]">Orders {totalOrdersCount > 0 && `(${totalOrdersCount})`}</span>
        </button>
      </footer>

      {/* DELIVERI Sister-Carrier Print Preview Overlay */}
      <AnimatePresence>
        {activeWaybillOrder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveWaybillOrder(null)}
              className="absolute inset-0 bg-slate-950 z-50 pointer-events-auto"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="absolute top-1/2 left-4 right-4 -translate-y-1/2 bg-white rounded-2xl p-4 text-slate-900 border border-slate-350 z-50 space-y-4 max-h-[85%] overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-2 border-b-2 border-dashed border-slate-300">
                <div className="flex items-center gap-1">
                  <Truck className="w-4 h-4 text-sky-600" />
                  <span className="font-sans font-black text-xs uppercase tracking-tight text-sky-600 block">
                    DELIVERI CARGO SYSTEM
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveWaybillOrder(null)}
                  className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Waybill Sticker Mockup */}
              <div className="p-3 bg-slate-50 border-2 border-slate-900 rounded-lg space-y-3 font-sans text-[10.5px] leading-tight select-all text-left">
                <div className="flex justify-between items-start pb-1.5 border-b border-slate-300">
                  <div>
                    <span className="text-[7.5px] text-slate-400 font-extrabold block">LOGISTICS NETWORK COURIER</span>
                    <span className="font-black text-[11px] text-slate-900 uppercase">TradeEase Sister AirCargo</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[7.5px] text-sky-650 font-extrabold block">PRIORITY ROUTE</span>
                    <span className="text-[10px] font-mono font-black text-slate-900 uppercase">
                      {activeWaybillOrder.shippingMethod?.includes('Swift') ? 'SWIFT' : 'STANDARD'}
                    </span>
                  </div>
                </div>

                {/* Sender Outlet */}
                <div className="pb-1.5 border-b border-slate-300">
                  <span className="text-[7.5px] text-slate-400 font-extrabold block uppercase">1. Sender Retail Store (Multivendor Terminal)</span>
                  <p className="font-extrabold text-slate-900">Verified Seller Hub # {activeWaybillOrder.items[0]?.productId.substring(0, 6).toUpperCase()}</p>
                  <span className="text-[9px] text-slate-500">{location.city}, {location.state} (NG)</span>
                </div>

                {/* Recipient Target */}
                <div className="pb-1.5 border-b border-slate-300">
                  <span className="text-[7.5px] text-slate-400 font-extrabold block uppercase">2. Consignee Delivery Point</span>
                  <p className="font-extrabold text-slate-900">{activeWaybillOrder.buyerName} ({activeWaybillOrder.buyerPhone})</p>
                  <p className="text-[9px] text-slate-700">{activeWaybillOrder.address}, {activeWaybillOrder.city}, {activeWaybillOrder.state} State Hub</p>
                </div>

                {/* Item manifest info */}
                <div className="pb-2 border-b border-slate-300 space-y-1">
                  <span className="text-[7.5px] text-slate-400 font-extrabold block uppercase">3. Packages Manifest (Multivendor Order Receipt)</span>
                  {activeWaybillOrder.items.map((it, i) => (
                    <div key={i} className="flex justify-between text-[9.5px]">
                      <span className="text-slate-850">• {it.productTitle}</span>
                      <strong className="text-slate-900">x{it.quantity}</strong>
                    </div>
                  ))}
                </div>

                {/* Simulated Barcode */}
                <div className="py-2 flex flex-col items-center justify-center space-y-1">
                  {/* barcode bars visual */}
                  <div className="h-9 w-full flex items-stretch gap-0.5 px-3 bg-white border border-slate-200">
                    {Array.from({ length: 42 }).map((_, i) => {
                      const heights = [ 'h-full', 'h-4/5', 'h-full', 'h-full', 'h-5/6' ];
                      const randomHeight = heights[Math.floor(i % heights.length)];
                      const widths = [ 'w-[1.2px]', 'w-[1.8px]', 'w-[0.8px]', 'w-[0.5px]', 'w-[1.5px]' ];
                      const randomWidth = widths[Math.floor((i * 3) % widths.length)];
                      const isWhite = i % 4 === 0 || i % 9 === 0;
                      return (
                        <div
                          key={i}
                          className={`${randomWidth} ${randomHeight} ${isWhite ? 'bg-white' : 'bg-slate-950'} shrink-0`}
                        />
                      );
                    })}
                  </div>
                  <span className="font-mono text-xs font-black text-slate-900 block tracking-widest text-center uppercase">
                    {activeWaybillOrder.deliveriTrackingNumber || 'DV-381-8172'}
                  </span>
                </div>
              </div>

              {/* Waybill Close and print alert */}
              <div className="space-y-2 text-center">
                <p className="text-[10px] text-slate-500 leading-normal max-w-xs mx-auto">
                  Paste this waybill barcode adhesive sticker on top of your courier carton before handing over to DELIVERI.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveWaybillOrder(null)}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs uppercase"
                >
                  Dismiss Sheet
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Dispatch Rider Notification Alert Overlay */}
      <AnimatePresence>
        {activeRiderNotification && (
          <>
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="absolute top-14 left-4 right-4 bg-sky-950 border border-sky-500 rounded-2xl p-4 text-white z-50 space-y-3.5 shadow-xl text-left"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 bg-sky-500/15 text-sky-400 rounded-lg flex items-center justify-center border border-sky-550/20">
                    <Truck className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[8px] bg-sky-500/15 text-sky-400 font-extrabold px-1.5 py-0.5 rounded font-mono uppercase tracking-wider block w-max leading-none">
                      RIDER PICKUP BOOKED
                    </span>
                    <h3 className="font-black text-xs mt-0.5 text-white">DELIVERI Dispatch Center</h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveRiderNotification(null)}
                  className="p-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-slate-950/40 rounded-xl space-y-1.5 text-[11px] border border-white/5 font-sans leading-relaxed">
                <p>
                  A verified **DELIVERI** courier rider has been automatically scheduled to pick up the parcel matching tracking <strong className="text-sky-400 font-mono">{activeRiderNotification.trackingNumber}</strong>.
                </p>
                <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                  <div className="bg-white/5 p-1.5 rounded-lg">
                    <span className="text-gray-400 text-[8px] uppercase font-bold block">Assigned Rider</span>
                    <span className="font-extrabold text-white">Chinedu Okeowo</span>
                  </div>
                  <div className="bg-white/5 p-1.5 rounded-lg">
                    <span className="text-gray-400 text-[8px] uppercase font-bold block">Estimated Arrival</span>
                    <span className="font-extrabold text-emerald-400">7 - 12 Minutes</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveRiderNotification(null)}
                className="w-full py-2 bg-sky-655 hover:bg-sky-500 text-white rounded-xl text-xs font-black uppercase text-center cursor-pointer bg-sky-600"
              >
                Acknowledge Assignment
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Request Withdrawal Modal */}
      <AnimatePresence>
        {showWithdrawModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWithdrawModal(false)}
              className="fixed inset-0 bg-black/60 z-[60]"
            />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="fixed bottom-0 inset-x-0 z-[60] bg-white dark:bg-slate-950 rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-gray-900 dark:text-white">Request Withdrawal</h3>
                <button onClick={() => setShowWithdrawModal(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Available balance: <strong className="text-gray-900 dark:text-white">
                  {withdrawalBalance ? formatNaira(withdrawalBalance.availableBalance) : '—'}
                </strong>
              </p>

              {withdrawError && (
                <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30 rounded-xl text-[11px] text-red-600 dark:text-red-400">
                  {withdrawError}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="text-[9.5px] font-black uppercase text-gray-400 tracking-wider">Amount (₦)</label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full mt-1 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[9.5px] font-black uppercase text-gray-400 tracking-wider">Bank Name</label>
                  <input
                    type="text"
                    value={withdrawBankName}
                    onChange={(e) => setWithdrawBankName(e.target.value)}
                    placeholder="e.g. GTBank"
                    className="w-full mt-1 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[9.5px] font-black uppercase text-gray-400 tracking-wider">Account Number</label>
                  <input
                    type="text"
                    value={withdrawAccountNumber}
                    onChange={(e) => setWithdrawAccountNumber(e.target.value)}
                    placeholder="0123456789"
                    className="w-full mt-1 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[9.5px] font-black uppercase text-gray-400 tracking-wider">Account Name</label>
                  <input
                    type="text"
                    value={withdrawAccountName}
                    onChange={(e) => setWithdrawAccountName(e.target.value)}
                    placeholder="As it appears on your bank account"
                    className="w-full mt-1 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                onClick={handleRequestWithdrawal}
                disabled={withdrawSubmitting}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-extrabold text-xs uppercase tracking-wide cursor-pointer transition-all"
              >
                {withdrawSubmitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
