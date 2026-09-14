import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import Logo from './Logo';
import { adminLogin } from '../api';

interface AdminLoginScreenProps {
  onLoginSuccess: (adminUser: { id: string; name: string; level: string }) => void;
  onBackToClient?: () => void;
}

export default function AdminLoginScreen({ onLoginSuccess, onBackToClient }: AdminLoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const admin = await adminLogin(email.trim().toLowerCase(), password);
      setLoading(false);
      onLoginSuccess({ id: admin.id, name: admin.name, level: admin.level });
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || 'Invalid admin credentials');
    }
  };

  return (
    <div className="min-h-screen bg-[#020d0b] text-[#dadfe1] flex flex-col font-sans">
      {/* Top bar */}
      <header className="border-b border-[#95C93D]/10 bg-[#001714]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between shrink-0">
        <Logo size="sm" showText={true} />

        {onBackToClient && (
          <button
            onClick={onBackToClient}
            className="text-xs font-bold text-gray-400 hover:text-white bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 transition-all cursor-pointer"
          >
            ← Back to storefront
          </button>
        )}
      </header>

      {/* Login form */}
      <main className="flex-1 w-full flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-[#001714] border border-[#95C93D]/20 p-8 rounded-3xl shadow-xl flex flex-col gap-6">
          <div className="space-y-1">
            <h3 className="text-xl font-extrabold text-white tracking-tight">Admin Sign In</h3>
            <p className="text-xs text-gray-400">Sign in to manage TradeEase.</p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-300">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@tradeease.ng"
                  required
                  className="w-full bg-[#030d0b] border border-[#95C93D]/20 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#95C93D]/60 focus:ring-1 focus:ring-[#95C93D]/30 transition-all"
                />
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#030d0b] border border-[#95C93D]/20 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#95C93D]/60 focus:ring-1 focus:ring-[#95C93D]/30 transition-all"
                />
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-[#95C93D] to-[#b1dc61] text-[#003D36] font-extrabold text-xs shadow-md tracking-wider uppercase cursor-pointer hover:shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#003D36]" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
