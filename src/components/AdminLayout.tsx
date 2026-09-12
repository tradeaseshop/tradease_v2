import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, Users, Shield, ShoppingBag, ShoppingCart, CreditCard, 
  FileText, Settings, LogOut, Moon, Sun, ArrowLeft, Bell, Calendar, ChevronRight,
  ChevronLeft, Menu, Truck, Compass, Star, ShieldAlert, X, Save, Headphones, ShieldCheck
} from 'lucide-react';

// Subviews
import AdminDashboardView from './AdminDashboardView';
import AdminUsersView from './AdminUsersView';
import AdminVendorsView from './AdminVendorsView';
import AdminProductsView from './AdminProductsView';
import AdminOrdersView from './AdminOrdersView';
import AdminPaymentsView from './AdminPaymentsView';
import AdminReportsView from './AdminReportsView';
import AdminSettingsView from './AdminSettingsView';
import AdminDeliveriView from './AdminDeliveriView';
import AdminKycView from './AdminKycView';

import { DEFAULT_SETTINGS } from './AdminMockData'; // fallback shape only, overwritten by real settings on load
import { AdminTab, AdminUser, AdminVendor, Transaction, ForumReport, AppSettings } from './AdminTypes';
import { Product, Order, SupportChatSession } from '../types';
import { CATEGORIES } from '../data';
import * as api from '../api';
import Logo from './Logo';

interface AdminLayoutProps {
  adminSession: { id: string; name: string; level: string; email?: string; phone?: string } | null;
  onUpdateAdminSession: (session: { id: string; name: string; level: string; email?: string; phone?: string }) => void;
  onAddUserUpstream: (user: AdminUser) => void;
  onAddVendorUpstream: (vendor: AdminVendor) => void;
  onBackToApp: () => void;
  productsList: Product[];
  ordersList: Order[];
  onRemoveProductUpstream: (id: string) => void;
  onUpdateOrderStatusUpstream: (id: string, s: Order['status']) => void;
  onAddProductUpstream: (p: Product) => void;
  darkMode: boolean;
  onThemeToggle: () => void;
  users: AdminUser[];
  vendors: AdminVendor[];
  onUpdateUserStatus: (userId: string, newStatus: AdminUser['status']) => void;
  onDeleteUser: (userId: string) => void;
  onUpdateVendorStatus: (vendorId: string, newStatus: AdminVendor['status']) => void;
  supportChats: SupportChatSession[];
  onAddSupportMessage: (sessionId: string, sender: 'user' | 'admin', senderName: string, content: string) => void;
  onResolveSupportChat: (sessionId: string) => void;
}

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function AdminLayout({
  adminSession,
  onUpdateAdminSession,
  onAddUserUpstream,
  onAddVendorUpstream,
  onBackToApp,
  productsList,
  ordersList,
  onRemoveProductUpstream,
  onUpdateOrderStatusUpstream,
  onAddProductUpstream,
  darkMode,
  onThemeToggle,
  users,
  vendors,
  onUpdateUserStatus,
  onDeleteUser,
  onUpdateVendorStatus,
  supportChats,
  onAddSupportMessage,
  onResolveSupportChat
}: AdminLayoutProps) {
  
  // Current active admin menu tab with back-navigation history tracking
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [tabHistory, setTabHistory] = useState<AdminTab[]>([]);

  const navigateToTab = (newTab: AdminTab) => {
    if (newTab === activeTab) return;
    setTabHistory((prev) => [...prev, activeTab]);
    setActiveTab(newTab);
  };

  const handleGoBackTab = () => {
    if (tabHistory.length === 0) return;
    const previousTab = tabHistory[tabHistory.length - 1];
    setTabHistory((prev) => prev.slice(0, -1));
    setActiveTab(previousTab);
  };

  // Unified Admin State stores — now backed by the REST API instead of mock data.
  const [reports, setReports] = useState<ForumReport[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS); // sensible defaults until the real ones load
  const [adminTeam, setAdminTeam] = useState<any[]>([]);

  // Real transactions, derived from the live orders list (no separate fetch
  // needed — every order already carries its own payment fields).
  const transactions: Transaction[] = ordersList.map((o) => ({
    id: o.id,
    buyerName: o.buyerName,
    email: '',
    amount: o.totalAmount,
    status: o.paymentStatus === 'Paid' ? 'success' : o.paymentStatus === 'Failed' ? 'failed' : 'pending',
    paymentMethod: o.paymentMethod === 'card' ? 'Paystack' : o.paymentMethod === 'bank' ? 'Bank Transfer' : 'Wallet',
    date: o.date,
    reference: o.paymentReference || o.trackingNumber || o.id,
  }));

  // Load settings, reports, and the admin team once on mount, then refresh
  // periodically so the backoffice stays current across multiple admins.
  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      try {
        const [settingsData, reportsData, teamData] = await Promise.all([
          api.getSettings(),
          api.getReports(),
          api.getAdminTeam(),
        ]);
        if (cancelled) return;
        setSettings(settingsData);
        setReports(reportsData);
        setAdminTeam(teamData);
      } catch (e) {
        console.error('Error loading admin backoffice data:', e);
      }
    };
    refresh();
    const interval = setInterval(refresh, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Active Toast list stack state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Dynamic Admin Support desk states
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [adminReplyText, setAdminReplyText] = useState<string>('');

  // Edit Profile Modal
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [profileName, setProfileName] = useState<string>(adminSession?.name || 'Chief Architect');
  const [profileEmail, setProfileEmail] = useState<string>(adminSession?.email || 'fauchagency@gmail.com');
  const [profileLevel, setProfileLevel] = useState<string>(adminSession?.level || 'Superuser Level-4');
  const [profilePhone, setProfilePhone] = useState<string>(adminSession?.phone || '+234 701 888 9999');

  // Toast trigger callback
  const handleToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto delete toast after delay
    setTimeout(() => {
      setToasts((prev) => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // ----------------------------------------------------
  // Interactive Gated Admin Actions
  // ----------------------------------------------------

  const handleRemoveProductLocal = (productId: string) => {
    onRemoveProductUpstream(productId);
  };

  const handleUpdateProductLocal = (product: Product) => {
    // updates main app catalog state
    onAddProductUpstream(product);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      handleToast('Name field cannot be left blank.', 'error');
      return;
    }
    if (!profileEmail.trim()) {
      handleToast('Email field cannot be left blank.', 'error');
      return;
    }

    try {
      const updated = await api.updateMyAdminProfile({ name: profileName.trim(), phone: profilePhone.trim() });
      onUpdateAdminSession({
        id: updated.id,
        name: updated.name,
        email: updated.email,
        level: updated.level,
        phone: updated.phone,
      });
      setShowProfileModal(false);
      handleToast('Administrator profile updated and saved.', 'success');
    } catch (err: any) {
      handleToast(err.message || 'Could not save profile changes.', 'error');
    }
  };

  const handleUpdateOrderStatusLocal = (orderId: string, newStatus: Order['status']) => {
    onUpdateOrderStatusUpstream(orderId, newStatus);
  };

  const handleUpdateReportStatus = async (reportId: string, newStatus: ForumReport['status']) => {
    try {
      const updated = await api.updateReportStatus(reportId, newStatus);
      setReports((prev) => prev.map((r) => (r.id === reportId ? updated : r)));
    } catch (err: any) {
      handleToast(err.message || 'Could not update dispute status.', 'error');
    }
  };

  const handleCreateReport = async (report: { reporterName: string; subject: string; type: ForumReport['type']; description?: string }) => {
    try {
      const created = await api.createReport(report);
      setReports((prev) => [created, ...prev]);
      handleToast('New dispute logged.', 'success');
    } catch (err: any) {
      handleToast(err.message || 'Could not log dispute.', 'error');
    }
  };

  const handleUpdateSettings = async (newSettings: AppSettings) => {
    try {
      const saved = await api.updateSettings(newSettings);
      setSettings(saved);
    } catch (err: any) {
      handleToast(err.message || 'Could not save settings.', 'error');
      throw err; // let AdminSettingsView know the save failed, so it doesn't show a false success toast
    }
  };

  // ---------- Admin team management ----------

  const handleInviteAdmin = async (admin: { name: string; email: string; password: string; level?: string; phone?: string }) => {
    try {
      const created = await api.inviteAdmin(admin);
      setAdminTeam((prev) => [created, ...prev]);
      handleToast(`${created.name} added to the admin team.`, 'success');
    } catch (err: any) {
      handleToast(err.message || 'Could not add admin.', 'error');
    }
  };

  const handleRemoveAdmin = async (id: string) => {
    try {
      await api.removeAdmin(id);
      setAdminTeam((prev) => prev.filter((a) => a.id !== id));
      handleToast('Admin removed from the team.', 'success');
    } catch (err: any) {
      handleToast(err.message || 'Could not remove admin.', 'error');
    }
  };

  // Sidebar expand/collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Nav categories meta list helper - prominent requested admin workflows prioritized
  const sidebarItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'vendors', label: 'Approve Vendors', icon: Shield },
    { id: 'kyc', label: 'KYC Verification', icon: ShieldCheck },
    { id: 'reports', label: 'Settle Disputes', icon: FileText },
    { id: 'deliveri', label: 'Logistics & APIs', icon: Truck },
    { id: 'products', label: 'Manage Catalog', icon: ShoppingBag },
    { id: 'orders', label: 'Order Processing', icon: ShoppingCart },
    { id: 'users', label: 'User Accounts', icon: Users },
    { id: 'payments', label: 'Finances & Fees', icon: CreditCard },
    { id: 'settings', label: 'System Settings', icon: Settings },
    { id: 'support', label: 'Support Live Chat', icon: Headphones },
  ] as const;

  return (
    <div className={`flex w-full min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300 relative`}>
      
      {/* Toast stacks notification overlay fixed top-right */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 80, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.95 }}
              transition={{ type: "spring", damping: 15 }}
              className={`p-4 rounded-xl border shadow-lg flex items-start gap-3 pointer-events-auto bg-white dark:bg-slate-900 ${
                toast.type === 'success'
                  ? 'border-emerald-500/20 text-emerald-600 dark:text-emerald-450'
                  : toast.type === 'error'
                    ? 'border-rose-500/25 text-rose-500'
                    : 'border-blue-500/20 text-blue-500'
              }`}
            >
              <div className="text-sm font-semibold">{toast.message}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* COLLAPSIBLE SIDEBAR: Styled TradeEase Deep Green ("#003D36") */}
      <aside 
        style={{ backgroundColor: '#003D36' }}
        className={`h-screen flex flex-col justify-between shrink-0 border-r border-[#95C93D]/10 text-white select-none sticky top-0 hidden md:flex transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        } shadow-2xl z-40`}
      >
        <div className={`py-6 flex flex-col h-full overflow-y-auto overflow-x-hidden ${isSidebarCollapsed ? 'px-3 space-y-6' : 'px-5.5 space-y-7.5'}`}>
          {/* Logo & Collapse Switch */}
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} gap-1.5 border-b border-[#95C93D]/10 pb-4`}>
            {!isSidebarCollapsed ? (
              <>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Logo size="md" />
                  <span className="text-[10px] font-black tracking-widest text-[#95C93D] uppercase font-mono bg-[#95C93D]/10 px-2 py-0.5 rounded-md inline-block border border-[#95C93D]/20 shadow-xs">ADMIN</span>
                </div>
                <button 
                  onClick={() => setIsSidebarCollapsed(true)}
                  className="p-1.5 text-gray-400 hover:text-[#95C93D] hover:bg-[#002f2a] rounded-lg cursor-pointer transition-colors"
                  title="Collapse Sidebar"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 shrink-0">
                <button
                  onClick={() => setIsSidebarCollapsed(false)}
                  className="p-2 text-[#95C93D] hover:bg-[#95C93D]/10 rounded-xl cursor-pointer transition-all border border-[#95C93D]/20"
                  title="Expand Sidebar"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Nav blocks lists */}
          <nav className="flex-1 space-y-1.5">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              if (isSidebarCollapsed) {
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      navigateToTab(item.id);
                      handleToast(`Navigated to ${item.label} ledger panel`, 'info');
                    }}
                    title={item.label}
                    className={`w-full flex items-center justify-center py-3.5 rounded-xl transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-[#95C93D] text-slate-950 shadow-lg scale-105'
                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-5.5 h-5.5 ${isActive ? 'text-slate-950' : 'text-gray-400'}`} />
                  </button>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    navigateToTab(item.id);
                    handleToast(`Navigated to ${item.label} ledger panel`, 'info');
                  }}
                  className={`w-full flex items-center justify-between py-2.8 px-4 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-[#95C93D] text-slate-950 shadow-md font-black scale-[1.01]'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white hover:pl-5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-slate-950' : 'text-gray-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-slate-950 stroke-[3px]" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Back and Logout utilities panel */}
        <div className={`p-4 border-t border-[#95C93D]/20 space-y-2 bg-[#002f2a] ${isSidebarCollapsed ? 'flex flex-col items-center px-1' : ''}`}>
          {isSidebarCollapsed ? (
            <>
              <button
                onClick={onBackToApp}
                title="Interactive Mobile UI"
                className="p-2 bg-[#95C93D]/10 hover:bg-[#95C93D]/20 text-[#95C93D] border border-[#95C93D]/30 rounded-xl cursor-pointer transition-colors flex items-center justify-center"
              >
                <ArrowLeft className="w-4.5 h-4.5" />
              </button>

              <button
                onClick={onBackToApp}
                title="Sign Out Admin"
                className="p-2 hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 rounded-xl cursor-pointer transition-colors flex items-center justify-center"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </>
          ) : (
            <>
              {/* Switch back to mobile sandbox */}
              <button
                onClick={onBackToApp}
                className="w-full py-2.5 px-4 bg-[#95C93D]/10 hover:bg-[#95C93D]/20 text-[#95C93D] border border-[#95C93D]/30 text-xs font-black rounded-xl duration-200 cursor-pointer flex items-center justify-center gap-2 transition-all hover:-translate-x-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Interactive Mobile</span>
              </button>

              <button
                onClick={onBackToApp}
                className="w-full py-2 px-4 hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 text-xs font-semibold rounded-xl duration-200 cursor-pointer flex items-center justify-center gap-2 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out Admin</span>
              </button>
            </>
          )}
        </div>
      </aside>

      {/* MAIN VIEW CONTROLLER ROW */}
      <main className="flex-1 flex flex-col min-w-0 max-h-screen overflow-y-auto">
        
        {/* Top Navbar Header */}
        <header className="bg-white dark:bg-slate-900 border-b border-gray-150 dark:border-slate-850 h-16 px-6 flex items-center justify-between shrink-0 sticky top-0 z-40 select-none">
          <div className="flex items-center gap-3.5">
            {/* Dynamic Back History Button if history exists */}
            {tabHistory.length > 0 && (
              <button
                onClick={handleGoBackTab}
                className="p-2 rounded-xl bg-gray-150 dark:bg-slate-800/80 hover:bg-[#95C93D] hover:text-slate-950 text-gray-700 dark:text-gray-300 flex items-center gap-1.5 text-xs font-black transition-all cursor-pointer border border-gray-200/50 dark:border-slate-700/60 active:scale-95 shadow-xs shrink-0"
                title={`Go back to ${tabHistory[tabHistory.length - 1]}`}
              >
                <ArrowLeft className="w-3.5 h-3.5 stroke-[3.5px]" />
                <span className="hidden sm:inline pr-0.5">Back</span>
              </button>
            )}

            {/* Logo placeholder for responsive mobile widths */}
            <div className="flex md:hidden items-center gap-2">
              <Logo size="sm" />
              <button 
                onClick={onBackToApp}
                className="p-1 border border-gray-200 dark:border-slate-800 rounded-lg text-emerald-500"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
            
            <div className="hidden md:block">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider font-mono">Platform Admin Portal</p>
              <h2 className="text-xs font-black text-gray-901 dark:text-white capitalize leading-3 mt-1 flex items-center gap-2">
                <span>Active Ledger:</span>
                <strong className="text-[#95C93D]">{settings.appName}</strong>
                <span className="text-[9px] font-mono font-black py-0.5 px-2 bg-slate-100 dark:bg-slate-950 rounded border border-gray-200 dark:border-slate-800 uppercase text-gray-500 dark:text-gray-400 tracking-wider">
                  {activeTab}
                </span>
              </h2>
            </div>
          </div>

          {/* Sub menu status indicators */}
          <div className="flex items-center gap-4">
            
            {/* Dynamic Local Clock */}
            <div className="text-right text-[10px] text-gray-450 font-mono font-bold hidden sm:block">
              <Calendar className="w-3.5 h-3.5 inline mr-1.5 align-text-bottom text-[#95C93D]" />
              <span>{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            </div>

            {/* Dark theme button */}
            <button
              onClick={onThemeToggle}
              className="p-2 border border-gray-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 duration-200 rounded-xl text-gray-500 dark:text-gray-400 cursor-pointer"
            >
              {darkMode ? <Sun className="w-4 h-4 text-[#95C93D]" /> : <Moon className="w-4 h-4 text-[#003D36]" />}
            </button>

            {/* Admin profile detail card */}
            <div 
              onClick={() => {
                setShowProfileModal(true);
                setProfileName(adminSession?.name || 'Chief Architect');
                setProfileEmail(adminSession?.email || 'fauchagency@gmail.com');
                setProfileLevel(adminSession?.level || 'Superuser Level-4');
                setProfilePhone(adminSession?.phone || '+234 701 888 9999');
              }}
              className="flex items-center gap-2.5 pl-3 border-l border-gray-200 dark:border-slate-800 cursor-pointer hover:opacity-80 active:scale-95 transition-all"
              title="Click to edit profile details"
            >
              <div className="w-8.5 h-8.5 rounded-xl bg-slate-900 dark:bg-slate-950 border border-[#95C93D]/30 flex items-center justify-center font-black text-xs text-[#95C93D] uppercase font-mono">
                {(adminSession?.name || 'AD').substring(0, 2).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block leading-none">
                <p className="text-xs font-extrabold text-gray-901 dark:text-white leading-none hover:text-[#95C93D] transition-colors">
                  {adminSession?.name || 'Chief Architect'}
                </p>
                <p className="text-[9.5px] text-gray-400 font-semibold font-mono tracking-wider mt-1 block">
                  {adminSession?.email || 'fauchagency@gmail.com'}
                </p>
              </div>
            </div>

          </div>
        </header>

        {/* Scrollable subview wrapper card frame */}
        <div className="p-6 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              
              {activeTab === 'dashboard' && (
                <AdminDashboardView 
                  users={users}
                  vendors={vendors}
                  products={productsList}
                  orders={ordersList}
                  transactions={transactions}
                  onNavigateTab={navigateToTab}
                  currencySymbol="₦"
                  isDarkMode={darkMode}
                />
              )}

              {activeTab === 'users' && (
                <AdminUsersView
                  users={users}
                  onUpdateUserStatus={onUpdateUserStatus}
                  onDeleteUser={onDeleteUser}
                  onAddUser={onAddUserUpstream}
                  onToast={handleToast}
                  isDarkMode={darkMode}
                />
              )}

              {activeTab === 'vendors' && (
                <AdminVendorsView
                  vendors={vendors}
                  onUpdateVendorStatus={onUpdateVendorStatus}
                  onAddVendor={onAddVendorUpstream}
                  onToast={handleToast}
                  currencySymbol="₦"
                  isDarkMode={darkMode}
                />
              )}

              {activeTab === 'kyc' && (
                <AdminKycView onToast={handleToast} isDarkMode={darkMode} />
              )}

              {activeTab === 'products' && (
                <AdminProductsView
                  products={productsList}
                  categories={CATEGORIES}
                  onAddProduct={handleUpdateProductLocal}
                  onRemoveProduct={handleRemoveProductLocal}
                  onUpdateProduct={handleUpdateProductLocal}
                  onToast={handleToast}
                  currencySymbol="₦"
                  isDarkMode={darkMode}
                />
              )}

              {activeTab === 'orders' && (
                <AdminOrdersView
                  orders={ordersList}
                  onUpdateOrderStatus={handleUpdateOrderStatusLocal}
                  onToast={handleToast}
                  currencySymbol="₦"
                  isDarkMode={darkMode}
                />
              )}

              {activeTab === 'payments' && (
                <AdminPaymentsView
                  transactions={transactions}
                  vendors={vendors}
                  onToast={handleToast}
                  currencySymbol="₦"
                  isDarkMode={darkMode}
                />
              )}

              {activeTab === 'reports' && (
                <AdminReportsView
                  reports={reports}
                  vendors={vendors}
                  onUpdateReportStatus={handleUpdateReportStatus}
                  onCreateReport={handleCreateReport}
                  onToast={handleToast}
                  currencySymbol="₦"
                  isDarkMode={darkMode}
                />
              )}

              {activeTab === 'deliveri' && (
                <AdminDeliveriView />
              )}

              {activeTab === 'settings' && (
                <AdminSettingsView
                  settings={settings}
                  onUpdateSettings={handleUpdateSettings}
                  onToast={handleToast}
                  isDarkMode={darkMode}
                  adminTeam={adminTeam}
                  currentAdminId={adminSession?.id}
                  onInviteAdmin={handleInviteAdmin}
                  onRemoveAdmin={handleRemoveAdmin}
                />
              )}

              {activeTab === 'support' && (
                <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs h-[620px] flex">
                  {/* Left Column: Tickets list */}
                  <div className="w-80 border-r border-gray-150 dark:border-slate-800 flex flex-col h-full bg-slate-50/50 dark:bg-slate-950/20">
                    <div className="p-4 border-b border-gray-150 dark:border-slate-800 shrink-0">
                      <h3 className="text-xs font-black text-gray-901 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <Headphones className="w-4 h-4 text-[#95C93D]" />
                        <span>Trade Support Center</span>
                      </h3>
                      <p className="text-[10px] text-gray-400 mt-1">
                        Active live helpdesk streams
                      </p>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800">
                      {supportChats.length === 0 ? (
                        <p className="text-xs p-4 text-center text-gray-400">No active support conversations.</p>
                      ) : (
                        supportChats.map((chat) => {
                          const isSelected = selectedChatId === chat.id;
                          const lastMsg = chat.messages[chat.messages.length - 1];
                          const hasUnresolved = chat.status === 'active';
                          return (
                            <div
                              key={chat.id}
                              onClick={() => setSelectedChatId(chat.id)}
                              className={`p-4 cursor-pointer text-left transition-colors duration-150 ${
                                isSelected 
                                  ? 'bg-emerald-500/10 border-l-4 border-emerald-600' 
                                  : 'hover:bg-gray-100/50 dark:hover:bg-slate-800/40'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-900 dark:text-white">{chat.userName}</span>
                                <span className={`text-[8.5px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                  chat.userRole === 'buyer'
                                    ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-750 text-blue-800 dark:text-blue-400'
                                    : 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-400'
                                }`}>
                                  {chat.userRole}
                                </span>
                              </div>
                              <p className="text-[10px] text-gray-400 font-mono mt-1 break-all truncate">{chat.userEmail}</p>
                              {lastMsg && (
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 truncate italic">
                                  {lastMsg.sender === 'admin' ? 'You: ' : ''}{lastMsg.content}
                                </p>
                              )}
                              <div className="flex items-center justify-between mt-3 pt-1 border-t border-gray-100 dark:border-slate-800/40">
                                <span className="text-[8px] text-gray-400 font-mono">
                                  {new Date(chat.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className={`text-[8px] font-black uppercase tracking-widest ${
                                  hasUnresolved ? 'text-emerald-500' : 'text-gray-405 text-gray-450 line-through'
                                }`}>
                                  {hasUnresolved ? '● Active' : 'Resolved'}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Right Column: Interaction view */}
                  <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900">
                    {(() => {
                      const chat = supportChats.find(c => c.id === selectedChatId);
                      if (!chat) {
                        return (
                          <div className="m-auto text-center p-6 space-y-4 max-w-sm">
                            <Headphones className="w-12 h-12 text-[#95C93D] mx-auto opacity-40 animate-pulse" />
                            <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">Support Operator Active</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-normal">
                              Select any user trade ledger inquiry from the side list to begin real-time escrow or dispatch support routing.
                            </p>
                          </div>
                        );
                      }

                      return (
                        <>
                          {/* Chat Window Header */}
                          <div className="p-4 border-b border-gray-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/10 shrink-0 flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">{chat.userName}</h4>
                                <span className="text-[9px] font-mono text-gray-400">ID: {chat.id}</span>
                              </div>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 font-mono">{chat.userEmail} | Nigeria Gateway</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {chat.status === 'active' ? (
                                <button
                                  onClick={() => {
                                    onResolveSupportChat(chat.id);
                                    handleToast(`Support Chat session marked as resolved`, 'success');
                                  }}
                                  className="py-1.5 px-3.5 bg-emerald-600 hover:bg-emerald-500 duration-150 text-white font-black text-[10px] rounded-lg cursor-pointer uppercase tracking-wider shadow-xs"
                                >
                                  Close Support Ticket
                                </button>
                              ) : (
                                <span className="py-1.5 px-3 bg-gray-100 dark:bg-slate-800 text-gray-500 font-bold text-[10px] rounded-lg select-none uppercase tracking-wider animate-fade-in">
                                  Resolved Session
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Chat Window Message stream */}
                          <div className="flex-1 overflow-y-auto p-5 bg-slate-50 dark:bg-slate-950/30 space-y-4 flex flex-col-reverse justify-end">
                            <div className="space-y-4">
                              {chat.messages.map((msg) => {
                                const isAdmin = msg.sender === 'admin';
                                return (
                                  <div
                                    key={msg.id}
                                    className={`flex flex-col max-w-[70%] ${isAdmin ? 'self-end items-end' : 'self-start items-start'}`}
                                  >
                                    <span className="text-[9px] text-gray-400 font-bold px-1.5 mb-1.5 flex items-center gap-1.5">
                                      <span>{isAdmin ? `${adminSession?.name || 'Admin'} (You)` : msg.senderName}</span>
                                      <span className="font-mono font-medium text-gray-400 text-[8px]">
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </span>
                                    <div className={`p-3 rounded-2xl text-xs leading-normal text-left ${
                                      isAdmin 
                                        ? 'bg-[#003D36] text-[#95C93D] rounded-tr-xs border border-[#95C93D]/20 shadow-xs' 
                                        : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-tl-xs border border-gray-200 dark:border-slate-800 shadow-xs'
                                    }`}>
                                      {msg.content}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Quick Automated Reply Canned templates */}
                          <div className="p-2.5 border-t border-gray-100 dark:border-slate-800 bg-slate-50/20 shrink-0 flex flex-wrap gap-2 items-center">
                            <span className="text-[9.5px] font-bold text-gray-450 uppercase tracking-widest mr-1">Canned replies:</span>
                            {[
                              { label: 'Verify Escrow', text: "Hello! We have reviewed your Nigeria Escrow Settlement. The funds are securely locked and will release as soon as DELIVERI records standard transit delivery receipt." },
                              { label: 'Dispatch Query', text: "Hello. We have pinged our DELIVERI courier service dispatcher for your region! Your tracking session is fully active." },
                              { label: 'Suspension warn', text: "Hi! This is the Admin Audit Team. Please ensure your listing catalog complies to TradeEase regulations to keep your store active." }
                            ].map((canned, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  onAddSupportMessage(chat.id, 'admin', adminSession?.name || 'Administrator', canned.text);
                                  handleToast('Canned reply dispatched', 'info');
                                }}
                                className="py-1 px-2 text-[9px] font-bold tracking-tight border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-650 hover:border-emerald-500/50 hover:text-[#95C93D] rounded-lg cursor-pointer duration-150 transition-colors"
                              >
                                {canned.label}
                              </button>
                            ))}
                          </div>

                          {/* Chat Reply Typing Form */}
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              if (!adminReplyText.trim()) return;
                              onAddSupportMessage(chat.id, 'admin', adminSession?.name || 'Administrator', adminReplyText.trim());
                              setAdminReplyText('');
                              handleToast('Message dispatched.', 'success');
                            }}
                            className="p-3 bg-white dark:bg-slate-900 border-t border-gray-150 dark:border-slate-800 flex gap-3 shrink-0 items-center"
                          >
                            <input
                              type="text"
                              value={adminReplyText}
                              onChange={(e) => setAdminReplyText(e.target.value)}
                              placeholder={`Type response to ${chat.userName}...`}
                              className="flex-1 py-2.5 px-3.5 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs focus:ring-1 focus:ring-emerald-550 focus:outline-none text-gray-900 dark:text-white"
                            />
                            <button
                              type="submit"
                              style={{ backgroundColor: '#003D36', color: '#95C93D' }}
                              className="py-2.5 px-4 rounded-xl font-black text-xs cursor-pointer hover:opacity-90 active:scale-95 border border-[#95C93D]/30 shadow-xs uppercase tracking-wider shrink-0 duration-150"
                            >
                              Dispatch reply
                            </button>
                          </form>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

      </main>

      {/* EDIT PROFILE MODAL COVER */}
      <AnimatePresence>
        {showProfileModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-xl text-left relative"
            >
              <button
                onClick={() => setShowProfileModal(false)}
                className="absolute right-4 top-4 p-1 rounded-lg text-gray-450 hover:bg-slate-150 dark:hover:bg-slate-850"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-sm font-black text-gray-950 dark:text-white uppercase tracking-tight mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#95C93D]" />
                Edit Admin Session Profile
              </h3>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 block uppercase font-mono">Full Name</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-205 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-[#95C93D] focus:outline-none text-gray-901 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 block uppercase font-mono">Corporate Email</label>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-205 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-[#95C93D] focus:outline-none text-gray-901 dark:text-white font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 block uppercase font-mono">Access Role Level</label>
                    <select
                      value={profileLevel}
                      onChange={(e) => setProfileLevel(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-205 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-[#95C93D] focus:outline-none text-gray-901 dark:text-white font-bold"
                    >
                      <option value="Superuser Level-4">Superuser Level-4</option>
                      <option value="System Architect">System Architect</option>
                      <option value="Escrow Analyst">Escrow Analyst</option>
                      <option value="Regional Manager-1">Regional Manager-1</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 block uppercase font-mono">Contact Phone</label>
                    <input
                      type="text"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-205 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-[#95C93D] focus:outline-none text-gray-910 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div className="pt-3 flex gap-2">
                  <button
                    type="submit"
                    style={{ backgroundColor: '#003D36', color: '#95C93D' }}
                    className="flex-1 py-2 text-xs font-black rounded-xl border border-[#95C93D]/30 flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-90 active:scale-98 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    <span>Apply Profile Changes</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowProfileModal(false)}
                    className="px-4 py-2 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Discard
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
