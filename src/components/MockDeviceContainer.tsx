import React, { useState, useRef, useEffect } from 'react';
import { 
  Smartphone, Monitor, Info, Wifi, Battery, Moon, Sun, ArrowLeftRight,
  Headphones, Send, X, ShieldAlert, Check
} from 'lucide-react';
import { SupportChatSession, UserSession } from '../types';

interface MockDeviceContainerProps {
  children: React.ReactNode;
  darkMode: boolean;
  onThemeToggle: () => void;
  activeRole: 'buyer' | 'vendor';
  onRoleToggle: () => void;
  locationLabel: string;
  currentUser: UserSession | null;
  supportChats: SupportChatSession[];
  onAddSupportMessage: (sessionId: string, sender: 'user' | 'admin', senderName: string, content: string) => void;
  onStartSupportSession: (userEmail: string, userName: string, userRole: 'buyer' | 'vendor') => string;
}

export default function MockDeviceContainer({
  children,
  darkMode,
  onThemeToggle,
  activeRole,
  onRoleToggle,
  locationLabel,
  currentUser,
  supportChats,
  onAddSupportMessage,
  onStartSupportSession,
}: MockDeviceContainerProps) {
  const [devicePlayground, setDevicePlayground] = useState<boolean>(true);

  // Live Support UI State
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  
  // Guest registration local state in case user is not logged in 
  const [guestEmail, setGuestEmail] = useState('');
  const [guestName, setGuestName] = useState('');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto Scroll Chat
  useEffect(() => {
    if (isSupportOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [isSupportOpen, supportChats]);

  // Bind active user session if logged in
  useEffect(() => {
    if (currentUser) {
      const sessId = onStartSupportSession(currentUser.email, currentUser.name, activeRole);
      setActiveSessionId(sessId);
    }
  }, [currentUser, activeRole]);

  // Formatting current standard time for the smartphone header status bar
  const formatTime = () => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${hours}:${minutes} ${ampm}`;
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;

    let targetSessId = activeSessionId;
    if (!targetSessId) {
      // Register guest session
      const nameVal = guestName.trim() || 'Guest Trader';
      const emailVal = guestEmail.trim() || 'guest@tradeease.ng';
      targetSessId = onStartSupportSession(emailVal, nameVal, activeRole);
      setActiveSessionId(targetSessId);
    }

    if (targetSessId) {
      const senderNick = currentUser ? currentUser.name : (guestName.trim() || 'Guest Trader');
      onAddSupportMessage(targetSessId, 'user', senderNick, supportMessage.trim());
      setSupportMessage('');
    }
  };

  const renderSupportWidget = () => {
    const currentSession = supportChats.find(chat => {
      if (currentUser) {
        return chat.userEmail.trim().toLowerCase() === currentUser.email.trim().toLowerCase();
      }
      return chat.id === activeSessionId;
    });

    const hasNewReplies = currentSession && currentSession.messages.length > 0 && 
      currentSession.messages[currentSession.messages.length - 1].sender === 'admin';

    return (
      <>
        {/* Floating Helpdesk Admin-Managed Support Launcher button in Bottom-Left */}
        <button
          onClick={() => setIsSupportOpen(true)}
          className="absolute bottom-20 left-4 z-40 w-12 h-12 bg-slate-900 dark:bg-slate-950 hover:bg-[#003D36] text-[#95C93D] rounded-full flex items-center justify-center shadow-2xl hover:shadow-emerald-500/10 active:scale-95 cursor-pointer hover:scale-105 duration-200 border border-[#95C93D]/30 group"
          title="Admin Managed Helpdesk Support"
        >
          <div className="absolute inset-0 rounded-full bg-[#95C93D] animate-ping opacity-10 group-hover:opacity-25" />
          <div className="relative flex items-center justify-center">
            {hasNewReplies && (
              <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
            )}
            {hasNewReplies && (
              <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border border-white dark:border-slate-900" />
            )}
            <Headphones className="w-5 h-5 text-[#95C93D] stroke-[2.2]" />
          </div>
          <span className="absolute bottom-14 left-4 bg-slate-950 border border-[#95C93D]/20 text-[#95C93D] font-extrabold text-[8px] px-2.5 py-1 rounded-lg whitespace-nowrap shadow-md opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest pointer-events-none">
            💬 Helpdesk Support
          </span>
        </button>

        {/* Live Support Portal Drawer overlay */}
        {isSupportOpen && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex flex-col justify-end">
            <div className="absolute inset-0" onClick={() => setIsSupportOpen(false)} />
            
            <div className="w-full h-[85%] bg-white dark:bg-slate-950 rounded-t-3xl border-t border-emerald-500/20 flex flex-col relative z-55 shadow-2xl overflow-hidden text-left">
              {/* Header block (TradeEase style) */}
              <div 
                style={{ backgroundColor: '#003D36' }}
                className="py-3 px-4 text-white flex items-center justify-between border-b border-[#95C93D]/10 shrink-0"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#95C93D]/10 border border-[#95C93D]/30 flex items-center justify-center">
                    <Headphones className="w-4 h-4 text-[#95C93D]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black tracking-tight text-white flex items-center gap-1.5 leading-none">
                      <span>Customer Care</span>
                      <span className="inline-block w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    </h3>
                    <p className="text-[8.5px] text-[#95C93D]/80 font-mono mt-1 font-bold">
                      Admin Backoffice Managed
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSupportOpen(false)}
                  className="p-1 px-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-black transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Chat messages collection container */}
              <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-950 space-y-3.5 flex flex-col">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/15 text-[10px] text-amber-700 dark:text-amber-400 leading-normal">
                  <p className="font-bold flex items-center gap-1 uppercase tracking-wide">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                    <span>Real-time Sandbox Link</span>
                  </p>
                  <p className="mt-0.5 opacity-90">
                    This support desk links directly to the **Admin Backoffice**. Admin users in the administrative dashboard can reply to you live. Try switching to Admin mode!
                  </p>
                </div>

                {!currentSession && !currentUser ? (
                  /* Guest Session Generator */
                  <div className="space-y-3.5 my-auto max-w-[280px] mx-auto text-center py-4">
                    <div className="text-gray-400 font-extrabold text-[11px] uppercase tracking-wider">Start support ticket</div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">
                      We can connect you with an administrator as a guest, or login to tie it to your registered wallet identity.
                    </p>
                    <div className="space-y-2">
                      <input 
                        type="text" 
                        placeholder="Your Business/Shop Name"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="w-full py-2 px-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none text-gray-800 dark:text-white"
                      />
                      <input 
                        type="email" 
                        placeholder="Your Account Email address"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        className="w-full py-2 px-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none text-gray-800 dark:text-white"
                      />
                    </div>
                    <button
                      onClick={() => {
                        const email = guestEmail.trim() || `guest-${Math.floor(1000 + Math.random()*9000).toString()}@tradeease.ng`;
                        const name = guestName.trim() || 'Guest Trader';
                        const id = onStartSupportSession(email, name, activeRole);
                        setActiveSessionId(id);
                      }}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl cursor-pointer duration-150"
                    >
                      Initialize Chat Session
                    </button>
                  </div>
                ) : (
                  /* Messages Display loop */
                  <>
                    <div className="text-center text-[8px] text-gray-400 bg-gray-100 dark:bg-slate-900/60 py-1 px-3 rounded-full inline-block mx-auto uppercase font-mono tracking-widest">
                      🔒 Connected via secure Escrow Admin node
                    </div>

                    {(currentSession?.messages || []).map((msg) => {
                      const isAdmin = msg.sender === 'admin';
                      return (
                        <div 
                          key={msg.id} 
                          className={`flex flex-col max-w-[85%] ${isAdmin ? 'self-start items-start' : 'self-end items-end'}`}
                        >
                          <span className="text-[8.5px] text-gray-400 font-bold px-1.5 mb-1">
                            {isAdmin ? 'System Backoffice' : msg.senderName}
                          </span>
                          <div className={`p-2.5 rounded-2xl text-[11px] leading-normal ${
                            isAdmin 
                              ? 'bg-[#003D36] text-white rounded-tl-xs border border-[#95C93D]/20 shadow-xs' 
                              : 'bg-emerald-500 text-white rounded-tr-xs shadow-xs'
                          }`}>
                            {msg.content}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Message Typing Panel */}
              {(currentSession || currentUser) && (
                <form 
                  onSubmit={handleSendMessage}
                  className="p-2.5 border-t border-gray-150 dark:border-slate-800 bg-white dark:bg-slate-950 flex gap-2 shrink-0 items-center"
                >
                  <input
                    type="text"
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    placeholder="Describe transaction / escrow query..."
                    className="flex-1 py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-xs text-gray-800 dark:text-white focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="p-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white flex items-center justify-center cursor-pointer duration-150"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-slate-150 dark:bg-slate-900 text-gray-800 dark:text-gray-100 font-sans flex flex-col justify-between">
      
      {/* Upper Global Desktop Bar - Keeps things professional */}
      <header className="bg-white dark:bg-slate-950 border-b border-gray-200 dark:border-gray-800 py-3.5 px-6 shadow-xs flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-extrabold text-xl shadow-md">
            TE
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight flex items-center gap-2">
              <span>TradeEase Interactive Companion</span>
              <span className="text-[10px] font-bold py-0.5 px-2 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                Live Prototype
              </span>
            </h1>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              Simulating Flutter's multi-role responsive paradigm – Delivered in {locationLabel || "Nigeria"}
            </p>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-2">
          {/* Quick Info Box on Role */}
          <div className="hidden lg:flex items-center gap-2 p-1.5 bg-gray-100 dark:bg-slate-800 rounded-lg text-[11px] mr-2">
            <span className="font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1">
              Active Mode:
            </span>
            <span className={`px-2 py-0.5 rounded-md font-extrabold uppercase tracking-wide text-xs ${
              activeRole === 'buyer' 
                ? 'bg-emerald-500 text-white' 
                : 'bg-amber-500 text-slate-900'
            }`}>
              {activeRole} Mode
            </span>
          </div>

          {/* Device toggle Button */}
          <button
            onClick={() => setDevicePlayground(!devicePlayground)}
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer transition-all"
            title="Toggle between real Smartphone body layout or responsive layout"
          >
            {devicePlayground ? (
              <>
                <Monitor className="w-4 h-4 text-emerald-500" />
                <span className="hidden sm:inline">Use Responsive Layout</span>
              </>
            ) : (
              <>
                <Smartphone className="w-4 h-4 text-emerald-500" />
                <span className="hidden sm:inline">Use Smartphone Shell</span>
              </>
            )}
          </button>

          {/* Quick Dual Role Switching */}
          <button
            onClick={onRoleToggle}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 rounded-lg shadow-xs cursor-pointer transition-all active:scale-95"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Switch UI to {activeRole === 'buyer' ? 'Vendor' : 'Buyer'}</span>
          </button>

          {/* Quick Dark Mode Indicator */}
          <button
            onClick={onThemeToggle}
            className="p-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer"
            aria-label="Toggle Theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-purple-600" />}
          </button>
        </div>
      </header>

      {/* Main body viewport container */}
      <main className="flex-1 w-full max-w-7xl mx-auto flex flex-col items-center justify-center p-4 md:p-6 lg:p-8 overflow-hidden">
        {devicePlayground ? (
          /* Smartphone Shell Wrap */
          <div className="w-full flex flex-col md:flex-row items-center justify-center gap-8 max-w-5xl">
            {/* Desktop explanation sidebar */}
            <div className="hidden md:flex flex-col gap-4 w-72 text-sm leading-relaxed shrink-0">
              <div className="p-4 bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-gray-200/60 dark:border-gray-800/80 space-y-3">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-extrabold">
                  <Info className="w-5 h-5 shrink-0" />
                  <span className="uppercase tracking-wider text-xs">Sandbox Guide</span>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white">Flutter Mobile Emulation</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  This shell mirrors a Material 3 premium platform layout running at high-density. Test the complete interactive flow:
                </p>
                <ul className="text-xs text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1.5 pl-1.5">
                  <li>🎨 **Onboarding walkthrough & splash transitions.**</li>
                  <li>📍 **Nigerian state/city hub mapping.**</li>
                  <li>🔄 **Instant dual roles switching (Buyer ↔ Vendor).**</li>
                  <li>🛒 **Place orders in Buyer mode — they dynamically append to Vendor live orders dashboard!**</li>
                  <li>➕ **Add new custom products as a Vendor — they instantly display inside the Buyer's catalog.**</li>
                </ul>
              </div>

              {/* Status Indicator */}
              <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                  <span>State Storage: Active Session</span>
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-normal">
                  All additions, shopping carts, and role modifications are updated in active browser state.
                </p>
              </div>
            </div>

            {/* Smart Phone Chassis */}
            <div className="relative mx-auto w-full max-w-[400px] h-[780px] bg-slate-950 rounded-[50px] p-3.5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.45)] border-4 border-slate-800/80 ring-15 ring-slate-900/5 transition-transform">
              
              {/* Dynamic Island/Speaker details */}
              <div className="absolute top-5 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-950 rounded-full z-30 flex items-center justify-between px-4 ring-1 ring-white/10">
                <span className="w-1.5 h-1.5 bg-neutral-800 rounded-full" />
                <span className="w-10 h-1 bg-neutral-900 rounded-full" />
                <span className="w-2.5 h-2.5 bg-blue-950/80 rounded-full outline-1 outline-neutral-800" />
              </div>

              {/* Smartphone Inner Screen Canvas */}
              <div className="relative w-full h-full bg-white dark:bg-slate-900 rounded-[38px] overflow-hidden flex flex-col select-none border border-slate-900">
                
                {/* Mobile Status Bar */}
                <div className="h-10 bg-slate-50 dark:bg-slate-950 px-6 pt-2 flex items-center justify-between text-xs font-semibold z-20 shrink-0 select-none text-slate-800 dark:text-slate-100">
                  <span>{formatTime()}</span>
                  <div className="flex items-center gap-1.5">
                    <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase">LTE</span>
                    <Battery className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>

                {/* Main Screen Content Body */}
                <div className="flex-1 w-full overflow-hidden relative">
                  {children}
                  {renderSupportWidget()}
                </div>

                {/* Mobile Home indicator bar */}
                <div className="h-6 bg-white dark:bg-slate-900 flex items-center justify-center shrink-0 z-20">
                  <div className="w-28 h-1 bg-gray-300 dark:bg-gray-700 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Full Screen Desktop Responsive Container */
          <div className="w-full max-w-4xl h-[780px] bg-white dark:bg-slate-950 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col relative transition-all">
            <div className="flex-1 overflow-hidden relative">
              {children}
              {renderSupportWidget()}
            </div>
          </div>
        )}
      </main>

      {/* Outer humble persistent Footer */}
      <footer className="py-3 px-6 text-center text-[10px] text-gray-400 dark:text-gray-500 shrink-0 bg-transparent border-t border-gray-150 dark:border-slate-800/40">
        TradeEase Nigeria Marketplace Limited • Fully compliant to Material 3 Design Norms • Running Port Node 3000
      </footer>
    </div>
  );
}

