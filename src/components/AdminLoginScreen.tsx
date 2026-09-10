import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Lock, Mail, Server, Activity, ArrowRight, Loader2, Cpu, HelpCircle } from 'lucide-react';
import Logo from './Logo';
import { adminLogin } from '../api';

interface AdminLoginScreenProps {
  onLoginSuccess: (adminUser: { id: string; name: string; level: string }) => void;
  onBackToClient?: () => void;
}

export default function AdminLoginScreen({ onLoginSuccess, onBackToClient }: AdminLoginScreenProps) {
  const [email, setEmail] = useState('admin@tradeease.ng');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [nodePing, setNodePing] = useState<number>(42);
  const [serverLocation] = useState('Lagos Hub East - Node 04');

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
    <div className="min-h-screen bg-[#020d0b] text-[#dadfe1] flex flex-col justify-between font-sans relative overflow-hidden selection:bg-[#95C93D] selection:text-[#003D36]">
      {/* Structural background patterns / security terminal overlay */}
      <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(to_right,#95c93d_1px,transparent_1px),linear-gradient(to_bottom,#95c93d_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#95C93D]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#003D36]/30 rounded-full blur-[150px] pointer-events-none" />

      {/* Top corporate banner bar */}
      <header className="border-b border-[#95C93D]/10 bg-[#001714]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#003D36] border border-[#95C93D]/30 flex items-center justify-center text-[#95C93D] font-black text-xl shadow-inner">
            TE
          </div>
          <div>
            <div className="text-sm font-black text-white flex items-center gap-2 tracking-wide uppercase">
              <span>TradeEase Backoffice</span>
              <span className="text-[9px] font-bold py-0.5 px-2 rounded bg-[#003D36] text-[#95C93D] border border-[#95C93D]/20 uppercase">
                Secure Terminal
              </span>
            </div>
            <p className="text-[10px] text-gray-400">Enterprise Unified Resource Planning System (ERP)</p>
          </div>
        </div>

        {onBackToClient && (
          <button
            onClick={onBackToClient}
            className="text-xs font-bold text-gray-400 hover:text-white bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 transition-all cursor-pointer"
          >
            ← Companion App
          </button>
        )}
      </header>

      {/* Main Terminal Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col lg:flex-row items-center justify-center gap-12 z-10">
        {/* Terminal Info Canvas (Left Panel) */}
        <div className="hidden lg:flex flex-col gap-6 w-1/2 text-sm leading-relaxed shrink-0 max-w-md">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#003D36]/60 border border-[#95C93D]/20 text-[#95C93D] rounded-full text-xs font-bold">
              <ShieldCheck className="w-4 h-4 font-bold" />
              <span>Multi-Tenant Administrative Node</span>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight leading-none">
              Control the TradeEase Nigeria Ecosystem.
            </h2>
            <p className="text-gray-400 text-xs">
              This Backoffice interface is an isolated, desktop-grade administrative environment used to monitor cross-regional operations, authorize wholesale delivery agents, oversee escrow compliance, and adjust operational logistics.
            </p>
          </div>

          <div className="border-t border-[#95C93D]/10 pt-6 space-y-4">
            <h4 className="text-xs font-black uppercase text-gray-500 tracking-wider">Live Host Operations</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-[#021310] border border-[#95C93D]/5 rounded-xl">
                <div className="text-[10px] text-gray-400 uppercase font-black tracking-wider flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-[#95C93D]" />
                  <span>Platform Region</span>
                </div>
                <div className="text-xs font-bold text-white mt-1">{serverLocation}</div>
              </div>

              <div className="p-3 bg-[#021310] border border-[#95C93D]/5 rounded-xl">
                <div className="text-[10px] text-gray-400 uppercase font-black tracking-wider flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-blue-400" />
                  <span>Latency Health</span>
                </div>
                <div className="text-xs font-bold text-[#95C93D] mt-1">{nodePing}ms • Stable</div>
              </div>
            </div>

            <div className="text-[10.5px] text-gray-500 flex items-start gap-1 p-2.5 bg-[#011b18]/40 border border-[#95C93D]/10 rounded-lg">
              <HelpCircle className="w-4 h-4 text-[#95C93D] shrink-0 mt-0.5" />
              <span>
                Authorized personnel strictly. Access, updates, and removals of products or vendor accounts are logged under ISO compliance policies.
              </span>
            </div>
          </div>
        </div>

        {/* Beautiful Login Form Panel (Right Panel) */}
        <div className="w-full max-w-md bg-[#001714] border border-[#95C93D]/20 p-8 rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)] flex flex-col gap-6 relative">
          <div className="absolute -top-3.5 right-6 bg-[#003D36] border border-[#95C93D]/40 text-[#95C93D] text-[9px] font-black uppercase tracking-widest py-1 px-3 rounded-md">
            Secured SSL
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>Sign-In to Enterprise Console</span>
            </h3>
            <p className="text-xs text-gray-400">
              Enter your enterprise credentials to access compliance, vendor stores, and regional logistics monitors.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
                Corporate ID / Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@tradeease.ng"
                  required
                  className="w-full bg-[#030d0b] border border-[#95C93D]/20 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#95C93D]/60 focus:ring-1 focus:ring-[#95C93D]/30 transition-all"
                />
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
                Terminal Password
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

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-[#95C93D] to-[#b1dc61] text-[#003D36] font-extrabold text-xs shadow-md tracking-wider uppercase cursor-pointer hover:shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#003D36]" />
                    <span>Authorizing Node Access...</span>
                  </>
                ) : (
                  <>
                    <span>Gain Authorized Access</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="text-center pt-2 border-t border-[#95C93D]/5">
            <span className="text-[10px] text-gray-500">
              Default seed credentials: admin@tradeease.ng / admin123
            </span>
          </div>
        </div>
      </main>

      {/* Bottom status strip */}
      <footer className="border-t border-[#95C93D]/10 bg-[#010908] py-4 px-6 text-center text-[10px] text-gray-500 shrink-0">
        System Node Status: SECURE • Encrypted RSA 4096-bit Handshake Built-In
      </footer>
    </div>
  );
}
