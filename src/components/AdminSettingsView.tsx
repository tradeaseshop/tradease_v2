import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Settings, Save, Key, DollarSign, BookOpen, AlertTriangle, RefreshCw, 
  Upload, CloudLightning, ShieldAlert, Landmark, Sparkles, CheckCircle,
  UserPlus, Trash2, Shield
} from 'lucide-react';
import { AppSettings } from './AdminTypes';

interface AdminSettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => Promise<void>;
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  isDarkMode?: boolean;
  adminTeam?: any[];
  currentAdminId?: string;
  onInviteAdmin?: (admin: { name: string; email: string; password: string; level?: string; phone?: string }) => void;
  onRemoveAdmin?: (id: string) => void;
}

export default function AdminSettingsView({
  settings,
  onUpdateSettings,
  onToast,
  isDarkMode = true,
  adminTeam = [],
  currentAdminId,
  onInviteAdmin,
  onRemoveAdmin,
}: AdminSettingsViewProps) {
  // Local editable state fields
  const [appName, setAppName] = useState(settings.appName);
  const [commissionPercent, setCommissionPercent] = useState(settings.commissionPercent);
  const [paymentGateway, setPaymentGateway] = useState(settings.paymentGateway);
  const [testMode, setTestMode] = useState(settings.testMode);
  const [payoutFrequency, setPayoutFrequency] = useState(settings.payoutFrequency);
  const [flatDeliveryFee, setFlatDeliveryFee] = useState(settings.flatDeliveryFee);
  const [restrictedCategories, setRestrictedCategories] = useState<string[]>(settings.restrictedCategories);

  // The real settings load asynchronously after this component first mounts
  // (see AdminLayout), so the form fields need to re-sync once they arrive —
  // otherwise this form would keep showing stale defaults forever.
  useEffect(() => {
    setAppName(settings.appName);
    setCommissionPercent(settings.commissionPercent);
    setPaymentGateway(settings.paymentGateway);
    setTestMode(settings.testMode);
    setPayoutFrequency(settings.payoutFrequency);
    setFlatDeliveryFee(settings.flatDeliveryFee);
    setRestrictedCategories(settings.restrictedCategories);
  }, [settings]);

  // Custom logo simulation
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [newCategoryTerm, setNewCategoryTerm] = useState('');

  // UX Saving state
  const [isSaving, setIsSaving] = useState(false);

  // Admin team invite form
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteLevel, setInviteLevel] = useState('Admin');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!appName.trim()) {
      onToast("App Name registry cannot remain blank.", "error");
      return;
    }
    if (commissionPercent < 0 || commissionPercent > 50) {
      onToast("Market commission rate must represent a margin between 0% and 50%", "error");
      return;
    }
    if (flatDeliveryFee < 0) {
      onToast("Logistics flat rate delivery fee cannot contain negative values.", "error");
      return;
    }

    setIsSaving(true);

    const compiled: AppSettings = {
      appName: appName.trim(),
      commissionPercent,
      paymentGateway,
      testMode,
      payoutFrequency,
      flatDeliveryFee,
      restrictedCategories
    };

    try {
      await onUpdateSettings(compiled);
      onToast("Platform configurations applied live globally on TradeEase.", "success");
    } catch (err: any) {
      onToast(err.message || "Could not save settings. Please try again.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim() || !invitePassword) {
      onToast('Name, email and password are required to invite an admin.', 'error');
      return;
    }
    onInviteAdmin?.({ name: inviteName.trim(), email: inviteEmail.trim(), password: invitePassword, level: inviteLevel });
    setShowInviteForm(false);
    setInviteName('');
    setInviteEmail('');
    setInvitePassword('');
    setInviteLevel('Admin');
  };


  const handleLogoUploadSimulate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setLogoPreview(reader.result as string);
        onToast("Custom brand logo loaded successfully.", "success");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddRestrictedCategory = () => {
    if (newCategoryTerm.trim()) {
      if (restrictedCategories.includes(newCategoryTerm.trim())) {
        onToast("Category already exists in restrictions list.", "info");
        return;
      }
      setRestrictedCategories(prev => [...prev, newCategoryTerm.trim()]);
      setNewCategoryTerm('');
      onToast(`Category "${newCategoryTerm.trim()}" blacklisted.`, "success");
    }
  };

  const handleRemoveCategory = (cat: string) => {
    setRestrictedCategories(prev => prev.filter(c => c !== cat));
    onToast(`Removed category "${cat}" from blacklist restrictions.`, "info");
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Platform Parameters
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Modify market commissions, sync Paystack webhook credentials, upload branding assets, and moderate blacklisted listing categories.
        </p>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        
        {/* Core Settings Parameters Column */}
        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-805/80 rounded-2xl p-5 shadow-xs space-y-4 lg:col-span-2">
          
          <h3 className="text-xs font-black text-gray-951 dark:text-white uppercase tracking-wider pl-0.5 flex items-center gap-1.5 border-b border-gray-100 dark:border-slate-850/50 pb-2">
            <Settings className="w-4 h-4 text-[#95C93D]" />
            Core Market Operations
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* App Name */}
            <div className="space-y-1">
              <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wide block font-mono pl-0.5">Portal branding name</label>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-805 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-[#95C93D] focus:outline-none text-gray-900 dark:text-white font-semibold"
              />
            </div>

            {/* Platform Commission Rate */}
            <div className="space-y-1">
              <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wide block font-mono pl-0.5">Platform Commission fee (%)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={commissionPercent}
                  onChange={(e) => setCommissionPercent(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-805 rounded-xl pl-3.5 pr-8 py-2 text-xs focus:ring-1 focus:ring-[#95C93D] focus:outline-none text-gray-900 dark:text-white font-mono font-bold"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-gray-450 font-black font-mono">%</span>
              </div>
            </div>

            {/* Flat Logistics Delivery Fees */}
            <div className="space-y-1">
              <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wide block font-mono pl-0.5">Flat delivery charge (₦)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs text-gray-400 font-extrabold font-mono">₦</span>
                <input
                  type="number"
                  value={flatDeliveryFee}
                  onChange={(e) => setFlatDeliveryFee(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-805 rounded-xl pl-8 pr-3 py-2 text-xs focus:ring-1 focus:ring-[#95C93D] focus:outline-none text-gray-900 dark:text-white font-mono font-bold"
                />
              </div>
            </div>

            {/* Automatic Payout clearance frequency */}
            <div className="space-y-1">
              <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wide block font-mono pl-0.5">Payout schedule</label>
              <select
                value={payoutFrequency}
                onChange={(e) => setPayoutFrequency(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-805 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#95C93D] text-gray-700 dark:text-gray-200 font-bold"
              >
                <option value="Daily">Daily payout</option>
                <option value="Weekly">Weekly Standard Term (Recommended)</option>
                <option value="Monthly">Monthly Hold Term</option>
              </select>
            </div>

          </div>

          <div className="pt-2">
            <h4 className="text-[11px] font-black uppercase text-gray-400 flex items-center gap-1.5 border-t border-gray-100 dark:border-slate-805 pt-4 pb-2">
              <Key className="w-4 h-4 text-[#95C93D]" /> Setup Paystack clearance gateway credentials
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <div className="space-y-1">
                <span className="text-[9.5px] text-gray-400 font-bold uppercase tracking-wider block font-mono pl-0.5">PAYSTACK SANDBOX PUBLIC KEY</span>
                <input
                  type="text"
                  placeholder="pk_test_a30985da..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-805 rounded-xl px-3.5 py-2 text-[11px] text-gray-803 dark:text-gray-250 font-mono focus:outline-none"
                  disabled
                />
              </div>

              <div className="space-y-1">
                <span className="text-[9.5px] text-gray-400 font-bold uppercase tracking-wider block font-mono pl-0.5">PAYSTACK WEBHOOK SECRET</span>
                <input
                  type="password"
                  placeholder="••••••••••••••••••••"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-805 rounded-xl px-3.5 py-2 text-[11px] text-gray-803 dark:text-gray-250 font-mono focus:outline-none"
                  disabled
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-805 pt-4">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 bg-emerald-500 rounded-full animate-pulse" />
              <div className="text-left text-xs text-gray-600 dark:text-gray-300">
                <span className="font-bold">Active Gateway Status:</span>{' '}
                <strong className="text-[#95C93D]">Payment Gateway Connected</strong>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              style={{ backgroundColor: '#003D36', color: '#95C93D' }}
              className="py-2.5 px-6 rounded-xl border border-[#95C93D]/30 shadow-md font-black text-xs uppercase duration-200 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#95C93D]" />
                  <span>Reloading metrics...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-[#95C93D]" />
                  <span>Save configurations</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* Brand visual and safety control column */}
        <div className="space-y-6">
          
          {/* Logo asset loading */}
          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-805 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-black text-gray-951 dark:text-white uppercase tracking-wider pl-0.5 flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-[#95C93D]" />
              TradeEase portal branding logo
            </h3>

            {/* Drag and drop image upload panel */}
            <div className="border border-dashed border-gray-250 dark:border-slate-800 rounded-xl p-4 text-center hover:border-[#95C93D] transition-colors relative cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUploadSimulate}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              
              <div className="space-y-2">
                {logoPreview ? (
                  <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto border border-gray-150 dark:border-slate-805">
                    <img src={logoPreview} alt="App logo previewed" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center mx-auto border border-gray-200/55 text-gray-400">
                    <Upload className="w-5 h-5 text-[#95C93D]" />
                  </div>
                )}
                
                <div className="text-xs">
                  <p className="font-bold text-gray-801 dark:text-white">Upload custom app logo asset</p>
                  <p className="text-[10px] text-gray-405 mt-1 block">Supports PNG, SVG, JPG up to 1MB</p>
                </div>
              </div>
            </div>
            
            <div className="bg-[#95C93D]/10 text-slate-950 p-3 rounded-xl border border-[#95C93D]/25 font-bold text-[11px] leading-snug">
              📝 <strong>Logo Guideline</strong>: TradeEase brand vectors should employ Deep Green background colors paired with Lime accents to preserve layout contrast standard.
            </div>
          </div>

          {/* Blacklisted categories */}
          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-805 rounded-2xl p-5 shadow-xs space-y-3.5">
            <h3 className="text-xs font-black text-gray-951 dark:text-white uppercase tracking-wider pl-0.5 flex items-center gap-1.5">
              <ShieldAlert className="w-4.5 h-4.5 text-rose-505" />
              restricted categories
            </h3>
            <p className="text-[10.5px] text-gray-500 leading-snug">
              Prevent sellers from listing items inside blacklisted marketplace departments.
            </p>

            {/* Input and add tag line */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Weaponry, Alcohol..."
                value={newCategoryTerm}
                onChange={(e) => setNewCategoryTerm(e.target.value)}
                className="flex-1 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-805 rounded-xl px-3 py-1.5 text-xs text-gray-901 dark:text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddRestrictedCategory}
                className="px-3 bg-rose-500/10 hover:bg-rose-500/20 duration-200 text-rose-500 border border-rose-500/25 rounded-xl text-xs font-bold cursor-pointer"
              >
                Add
              </button>
            </div>

            {/* Tag lists */}
            <div className="flex flex-wrap gap-1.5 pt-2">
              {restrictedCategories.map((cat, id) => (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-950/20 px-2 py-0.5 border border-rose-500/15 rounded-md"
                >
                  {cat}
                  <button
                    type="button"
                    onClick={() => handleRemoveCategory(cat)}
                    className="text-gray-400 hover:text-rose-505"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

          </div>

        </div>

      </form>

      {/* Admin Team Management */}
      <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-805 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#95C93D]" />
            <div>
              <h3 className="text-xs font-bold text-gray-950 dark:text-white uppercase tracking-wider">Admin Backoffice Team</h3>
              <p className="text-[11px] text-gray-400">Who else can log into this admin panel</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowInviteForm((v) => !v)}
            className="py-1.5 px-3 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Invite Admin
          </button>
        </div>

        {showInviteForm && (
          <form onSubmit={handleInviteSubmit} className="p-3 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl space-y-2.5 text-xs">
            <div className="grid grid-cols-2 gap-2.5">
              <input
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Full name"
                className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2 text-gray-900 dark:text-white"
              />
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Email address"
                className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2 text-gray-900 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <input
                type="password"
                value={invitePassword}
                onChange={(e) => setInvitePassword(e.target.value)}
                placeholder="Temporary password"
                className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2 text-gray-900 dark:text-white"
              />
              <select
                value={inviteLevel}
                onChange={(e) => setInviteLevel(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2 text-gray-900 dark:text-white"
              >
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="Office Assistant">Office Assistant</option>
                <option value="Support Agent">Support Agent</option>
                <option value="Superuser Level-4">Superuser Level-4</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase text-[10px] cursor-pointer"
            >
              Add to Team
            </button>
          </form>
        )}

        <div className="divide-y divide-gray-100 dark:divide-slate-850">
          {adminTeam.length === 0 && (
            <p className="text-[11px] text-gray-400 py-3">Loading admin team…</p>
          )}
          {adminTeam.map((admin) => (
            <div key={admin.id} className="flex items-center justify-between py-2.5">
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white">
                  {admin.name}
                  {admin.id === currentAdminId && (
                    <span className="ml-2 text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase">You</span>
                  )}
                </p>
                <p className="text-[10px] text-gray-400">{admin.email} · {admin.level}</p>
              </div>
              {admin.id !== currentAdminId && (
                <button
                  onClick={() => onRemoveAdmin?.(admin.id)}
                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 cursor-pointer"
                  title="Remove from team"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
