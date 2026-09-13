import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, Phone, Check, Loader2, Chrome, AlertCircle, X } from 'lucide-react';
import { UserSession } from '../types';
import Logo from './Logo';
import { registerAccount, loginAccount, getGoogleAuthConfig, googleLogin } from '../api';

interface AuthScreenProps {
  onAuthCompleted: (session: UserSession) => void;
  onSkip: () => void;
  initialMode?: 'login' | 'signup';
  adminUsers?: any[];
  onAdminSelected?: () => void;
}

export default function AuthScreen({ onAuthCompleted, onSkip, initialMode = 'login', adminUsers, onAdminSelected }: AuthScreenProps) {
  const [tab, setTab] = useState<'login' | 'signup'>(initialMode);
  const [accountRole, setAccountRole] = useState<'buyer' | 'vendor'>('buyer');
  
  // Traditional form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  
  // UX Feedback states
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | 'apple' | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const isEmailSuspended = (testEmail: string) => {
    if (!adminUsers) return false;
    const matched = adminUsers.find(u => u.email.trim().toLowerCase() === testEmail.trim().toLowerCase());
    return matched ? matched.status === 'Suspended' : false;
  };

  // Social simulation state
  const [simulatedAccounts, setSimulatedAccounts] = useState([
    { name: 'Fauch Agency', email: 'fauchagency@gmail.com', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80' },
    { name: 'Kunle Adeleke', email: 'kunle.ade@gmail.com', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80' },
    { name: 'Amara Nwosu', email: 'amara.nwosu@yahoo.com', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80' }
  ]);
  const [showSocialSelector, setShowSocialSelector] = useState(false);

  // ---------- Real Google Sign-In ----------
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);
  const [googleScriptReady, setGoogleScriptReady] = useState(false);

  // Fetch the client id (safe to expose) and load Google's Identity Services
  // script once, on mount, so the button is ready the moment it's clicked.
  useEffect(() => {
    getGoogleAuthConfig()
      .then((config) => {
        if (config.configured && config.clientId) setGoogleClientId(config.clientId);
      })
      .catch(() => {
        // Not configured yet — the button below will show a clear message instead of failing silently.
      });

    if ((window as any).google?.accounts?.id) {
      setGoogleScriptReady(true);
      return;
    }
    const existing = document.getElementById('google-identity-script');
    if (existing) {
      existing.addEventListener('load', () => setGoogleScriptReady(true));
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-identity-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => setGoogleScriptReady(true);
    document.body.appendChild(script);
  }, []);

  const handleGoogleCredential = async (credential: string) => {
    setErrorMsg('');
    setSocialLoading('google');
    try {
      const session = await googleLogin(credential, accountRole);
      setSocialLoading(null);
      setSuccess(true);
      setTimeout(() => {
        onAuthCompleted({ ...session, role: session.role || accountRole, provider: 'google' });
      }, 500);
    } catch (err: any) {
      setSocialLoading(null);
      setErrorMsg(err.message || 'Google sign-in failed. Please try again.');
    }
  };

  const handleGoogleClick = () => {
    setErrorMsg('');
    if (!googleClientId || !googleScriptReady || !(window as any).google?.accounts?.id) {
      setErrorMsg('Google Sign-In is not set up on this store yet. Please use email & password instead.');
      return;
    }
    setSocialLoading('google');
    const google = (window as any).google;
    google.accounts.id.initialize({
      client_id: googleClientId,
      callback: (response: { credential: string }) => handleGoogleCredential(response.credential),
    });
    google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed?.() || notification.isSkippedMoment?.()) {
        setSocialLoading(null);
        setErrorMsg('Google sign-in was dismissed or blocked by your browser. Please try again.');
      }
    });
  };

  const validateEmail = (val: string) => {
    return /\S+@\S+\.\S+/.test(val);
  };

  const handleTraditionalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (tab === 'signup' && !name.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }

    if (!email.trim() || !validateEmail(email)) {
      setErrorMsg('Please enter a valid email address');
      return;
    }

    if (isEmailSuspended(email)) {
      setErrorMsg(`Administrative Block: Account (${email.trim()}) has been suspended. Please contact TradeEase compliance@tradeease.ng`);
      return;
    }

    if (password.length < 5) {
      setErrorMsg('Password must be at least 5 characters');
      return;
    }

    if (tab === 'signup' && phone.trim() && phone.length < 9) {
      setErrorMsg('Please enter a valid Nigeria phone number');
      return;
    }

    setLoading(true);

    try {
      const session =
        tab === 'signup'
          ? await registerAccount({
              name: name.trim(),
              email: email.trim().toLowerCase(),
              phone: phone || undefined,
              password,
              role: accountRole,
            })
          : await loginAccount(email.trim().toLowerCase(), password);

      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        onAuthCompleted({ ...session, role: session.role || accountRole });
      }, 500);
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    }
  };

  const triggerSocialAuth = (provider: 'facebook' | 'apple') => {
    setErrorMsg('');
    setSocialLoading(provider);

    // After 1 second, showcase the secure authorization prompt
    setTimeout(() => {
      setSocialLoading(null);
      if (provider === 'facebook') {
        setShowSocialSelector(true);
      } else {
        // Direct simulation for Apple
        setSuccess(true);
        const session: UserSession = {
          name: 'Naira Shopper',
          email: 'secure.apple.id@icloud.com',
          phone: '+234 90 9123 4567',
          provider: 'apple',
          role: accountRole,
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'
        };
        setTimeout(() => {
          onAuthCompleted(session);
        }, 800);
      }
    }, 1000);
  };

  const selectSocialAccount = (account: typeof simulatedAccounts[0], provider: 'google' | 'facebook') => {
    setShowSocialSelector(false);
    
    if (isEmailSuspended(account.email)) {
      setErrorMsg(`Administrative Block: Account (${account.email}) has been suspended. Please contact TradeEase compliance@tradeease.ng`);
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      
      const session: UserSession = {
        name: account.name,
        email: account.email,
        phone: '+234 80 ' + Math.floor(30000000 + Math.random() * 69000000),
        provider: provider,
        role: accountRole,
        avatar: account.avatar
      };

      setTimeout(() => {
        onAuthCompleted(session);
      }, 800);
    }, 900);
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 font-sans justify-between overflow-hidden relative">
      
      {/* Background Mesh */}
      <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:16px_28px] pointer-events-none" />
      
      {/* Header */}
      <div className="flex items-center justify-between p-5 z-20 shrink-0">
        <Logo size="sm" showText={true} animate={false} showTagline={false} />
        <button
          type="button"
          onClick={onSkip}
          className="text-gray-500 hover:text-white transition-colors cursor-pointer p-1 -m-1"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Flow Canvas */}
      <div className="flex-1 px-6 flex flex-col justify-center overflow-y-auto z-10 py-2">
        
        <div className="text-center mb-6 shrink-0">
          <h2 className="text-xl font-black text-white tracking-tight">
            {tab === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
        </div>

        {/* Tab Selection Switch */}
        <div className="bg-slate-900 border border-white/5 p-1 rounded-xl flex gap-1 mb-5 shrink-0">
          <button
            onClick={() => { setTab('login'); setErrorMsg(''); }}
            className={`flex-1 py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
              tab === 'login'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab('signup'); setErrorMsg(''); }}
            className={`flex-1 py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
              tab === 'signup'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-500/20 text-red-400 text-[10.5px] rounded-xl flex items-start gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* SUCCESS overlay */}
        {success && (
          <div className="p-4 bg-emerald-950/50 border border-emerald-500/20 rounded-xl text-center space-y-1.5 mb-4 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 mx-auto flex items-center justify-center text-emerald-400">
              <Check className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-emerald-400">Signed In</h3>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleTraditionalSubmit} className="space-y-3.5">
          
          {/* Account type */}
          <div className="space-y-1 bg-slate-900/60 p-2.5 rounded-xl border border-white/5">
            <label className="text-[9.5px] font-black uppercase text-amber-500 tracking-wider pl-1 font-mono block">
              Account Type
            </label>
            <select
              value={accountRole}
              onChange={(e) => setAccountRole(e.target.value as 'buyer' | 'vendor')}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer font-sans"
              disabled={loading || success}
            >
              <option value="buyer">🛍️ Buyer</option>
              <option value="vendor">🏪 Vendor</option>
            </select>
          </div>
          {tab === 'signup' && (
            <div className="space-y-1">
              <label className="text-[9.5px] font-black uppercase text-gray-400 tracking-wider pl-1 font-mono">
                {accountRole === 'vendor' ? 'Store Name' : 'Full Name'}
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder={accountRole === 'vendor' ? 'e.g. Aba Master Crafts' : 'e.g. Kunle Adeleke'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  disabled={loading || success}
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[9.5px] font-black uppercase text-gray-400 tracking-wider pl-1 font-mono">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
              <input
                type="email"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                disabled={loading || success}
              />
            </div>
          </div>

          {tab === 'signup' && (
            <div className="space-y-1">
              <label className="text-[9.5px] font-black uppercase text-gray-400 tracking-wider pl-1 font-mono">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
                <input
                  type="tel"
                  placeholder="e.g. +234 80 1234 5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  disabled={loading || success}
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[9.5px] font-black uppercase text-gray-400 tracking-wider pl-1 font-mono">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                disabled={loading || success}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-extrabold text-xs tracking-wider uppercase shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Please wait...</span>
              </>
            ) : (
              <span>{tab === 'login' ? 'Sign In' : 'Create Account'}</span>
            )}
          </button>
        </form>

        {/* Dynamic HR social entry line */}
        <div className="relative my-5 shrink-0 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5"></div>
          </div>
          <span className="relative z-10 px-3 bg-slate-950 text-[9px] uppercase tracking-widest font-black text-gray-500">
            or continue with
          </span>
        </div>

        {/* Social Buttons Stack */}
        <div className="grid grid-cols-2 gap-2.5 shrink-0">
          {/* Google Entry */}
          <button
            type="button"
            onClick={handleGoogleClick}
            disabled={loading || socialLoading !== null || success}
            className="col-span-2 sm:col-span-1 rounded-xl bg-slate-900/60 hover:bg-slate-900 duration-200 py-2.5 px-3 border border-white/5 hover:border-emerald-500/20 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {socialLoading === 'google' ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span className="truncate">Google</span>
          </button>

          {/* Facebook Entry */}
          <button
            type="button"
            onClick={() => triggerSocialAuth('facebook')}
            disabled={loading || socialLoading !== null || success}
            className="rounded-xl bg-slate-900/60 hover:bg-slate-900 duration-200 py-2.5 px-3 border border-white/5 hover:border-emerald-500/20 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {socialLoading === 'facebook' ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
            ) : (
              <svg className="w-4 h-4" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            )}
            <span className="truncate">Facebook</span>
          </button>

          {/* Apple Entry */}
          <button
            type="button"
            onClick={() => triggerSocialAuth('apple')}
            disabled={loading || socialLoading !== null || success}
            className="rounded-xl bg-slate-900/60 hover:bg-slate-900 duration-200 py-2.5 px-3 border border-white/5 hover:border-emerald-500/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.2.67-2.92 1.49-.6.69-1.12 1.83-.98 2.94 1.08.08 2.21-.55 2.91-1.37z" />
            </svg>
            <span className="truncate">Apple</span>
          </button>
        </div>
      </div>

      {/* Admin access */}
      <div className="p-4 border-t border-white/5 bg-slate-900/30 flex flex-col items-center gap-2 shrink-0">
        {onAdminSelected && (
          <button
            type="button"
            onClick={onAdminSelected}
            className="text-[10px] font-bold text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
          >
            Admin Login
          </button>
        )}
      </div>

      {/* Google/Meta Account Selector Simulator Pop-Up Overlay */}
      <AnimatePresence>
        {showSocialSelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-end justify-center"
          >
            <motion.div
              initial={{ y: 150 }}
              animate={{ y: 0 }}
              exit={{ y: 150 }}
              className="w-full bg-slate-900 rounded-t-3xl border-t border-white/10 p-5 space-y-4 max-h-[80%] overflow-y-auto"
            >
              <div className="w-12 h-1 bg-white/10 rounded-full mx-auto" />
              <div className="text-center">
                <div className="w-10 h-10 rounded-xl bg-slate-950 mx-auto flex items-center justify-center mb-2 border border-white/5">
                  <Chrome className="w-5 h-5 text-emerald-400" />
                </div>
                <h4 className="text-xs font-black text-white">Choose an Account</h4>
              </div>

              <div className="space-y-2 pt-2">
                {simulatedAccounts.map((acc, index) => (
                  <button
                    key={index}
                    onClick={() => selectSocialAccount(acc, 'facebook')}
                    className="w-full p-2.5 bg-slate-950 border border-white/5 hover:border-emerald-500/20 rounded-xl flex items-center gap-3 transition-all cursor-pointer text-left"
                  >
                    <img
                      src={acc.avatar}
                      alt={acc.name}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-black text-white truncate">{acc.name}</p>
                      <p className="text-[9px] text-gray-400 truncate">{acc.email}</p>
                    </div>
                    <span className="text-[8px] bg-emerald-500/10 text-emerald-400 font-extrabold px-1.5 py-0.5 rounded-md uppercase">
                      Select
                    </span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowSocialSelector(false)}
                className="w-full py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg text-[10.5px] font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
