import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, User, Phone, Check, Loader2, AlertCircle, X } from 'lucide-react';
import { UserSession } from '../types';
import Logo from './Logo';
import { registerAccount, loginAccount, getGoogleAuthConfig, googleLogin } from '../api';

interface AuthScreenProps {
  onAuthCompleted: (session: UserSession) => void;
  onSkip: () => void;
  initialMode?: 'login' | 'signup';
  initialAccountRole?: 'buyer' | 'vendor';
}

export default function AuthScreen({ onAuthCompleted, onSkip, initialMode = 'login', initialAccountRole = 'buyer' }: AuthScreenProps) {
  const [tab, setTab] = useState<'login' | 'signup'>(initialMode);
  const [accountRole, setAccountRole] = useState<'buyer' | 'vendor'>(initialAccountRole);
  
  // Traditional form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [awaitingTotp, setAwaitingTotp] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  
  // UX Feedback states
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const [legalDocument, setLegalDocument] = useState<'terms' | 'privacy' | null>(null);

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

    if (password.length < 10) {
      setErrorMsg('Password must be at least 10 characters');
      return;
    }

    if (tab === 'signup' && phone.trim() && phone.length < 9) {
      setErrorMsg('Please enter a valid Nigeria phone number');
      return;
    }

    setLoading(true);

    try {
      if (tab === 'signup') {
        const session = await registerAccount({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone || undefined,
          password,
          role: accountRole,
        });
        setLoading(false);
        setSuccess(true);
        setTimeout(() => {
          onAuthCompleted({ ...session, role: session.role || accountRole });
        }, 500);
        return;
      }

      const result = await loginAccount(email.trim().toLowerCase(), password, awaitingTotp ? totpCode.trim() : undefined);
      setLoading(false);

      if (result.requiresTotp) {
        setAwaitingTotp(true);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onAuthCompleted({ ...result.user, role: result.user.role || accountRole });
      }, 500);
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    }
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
        {awaitingTotp ? (
          <form onSubmit={handleTraditionalSubmit} className="space-y-3.5">
            <div className="text-center space-y-1 mb-2">
              <p className="text-xs text-gray-300">Enter the 6-digit code from your authenticator app.</p>
            </div>
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              maxLength={6}
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-center text-lg tracking-[0.4em] font-mono text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              disabled={loading || success}
            />
            <button
              type="submit"
              disabled={loading || success || totpCode.length !== 6}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-extrabold text-xs shadow-md tracking-wider uppercase cursor-pointer hover:shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:translate-y-0"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <span>Verify</span>}
            </button>
            <button
              type="button"
              onClick={() => { setAwaitingTotp(false); setTotpCode(''); setErrorMsg(''); }}
              className="w-full text-center text-[10px] text-gray-500 hover:text-gray-300 cursor-pointer"
            >
              ← Back
            </button>
          </form>
        ) : (
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

          {tab === 'signup' && (
            <p className="text-[10px] leading-relaxed text-gray-400 text-center px-1 -mt-1 mb-1">
              By signing up, you agree to TradeEase&apos;s{' '}
              <button
                type="button"
                onClick={() => setLegalDocument('terms')}
                className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 font-semibold"
              >
                Terms of Use
              </button>{' '}
              and{' '}
              <button
                type="button"
                onClick={() => setLegalDocument('privacy')}
                className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 font-semibold"
              >
                Privacy Policy
              </button>.
            </p>
          )}

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
        )}

        {!awaitingTotp && (
        <>
        {/* Dynamic HR social entry line */}
        <div className="relative my-5 shrink-0 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5"></div>
          </div>
          <span className="relative z-10 px-3 bg-slate-950 text-[9px] uppercase tracking-widest font-black text-gray-500">
            or continue with
          </span>
        </div>

        <button
          type="button"
          onClick={handleGoogleClick}
          disabled={loading || socialLoading !== null || success}
          className="w-full rounded-xl bg-slate-900/60 hover:bg-slate-900 duration-200 py-2.5 px-3 border border-white/5 hover:border-emerald-500/20 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          {socialLoading === 'google' ? <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> : <span className="w-4 h-4 rounded-full bg-white text-slate-900 flex items-center justify-center text-[9px] font-black">G</span>}
          <span className="truncate">Continue with Google</span>
        </button>
        </>
        )}
      </div>


      {legalDocument && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3"
          role="dialog"
          aria-modal="true"
          aria-label={legalDocument === 'terms' ? 'Terms of Use' : 'Privacy Policy'}
          onClick={() => setLegalDocument(null)}
        >
          <div
            className="w-full max-w-3xl h-[92vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-white/10 shrink-0">
              <h3 className="text-sm font-bold text-white">
                {legalDocument === 'terms' ? 'TradeEase Terms of Use' : 'TradeEase Privacy Policy'}
              </h3>
              <button
                type="button"
                onClick={() => setLegalDocument(null)}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
                aria-label="Close legal document"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <iframe
              title={legalDocument === 'terms' ? 'TradeEase Terms of Use' : 'TradeEase Privacy Policy'}
              src={legalDocument === 'terms' ? '/legal/terms-of-use.html' : '/legal/privacy-policy.html'}
              className="w-full flex-1 border-0 bg-white"
            />
          </div>
        </div>
      )}
    </div>
  );
}
