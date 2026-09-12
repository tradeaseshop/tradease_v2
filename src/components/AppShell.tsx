import React, { useState, useRef, useEffect } from 'react';
import { Headphones, Send, X, ShieldAlert } from 'lucide-react';
import { SupportChatSession, UserSession } from '../types';

interface AppShellProps {
  children: React.ReactNode;
  activeRole: 'buyer' | 'vendor';
  currentUser: UserSession | null;
  supportChats: SupportChatSession[];
  onAddSupportMessage: (sessionId: string, sender: 'user' | 'admin', senderName: string, content: string) => void;
  onStartSupportSession: (userEmail: string, userName: string, userRole: 'buyer' | 'vendor') => string;
}

/**
 * The real app container. This replaces what used to be a decorative
 * desktop demo — a fake phone chassis with a mock status bar, a "Switch UI
 * to Vendor" toolbar, and an explanatory sidebar — none of which belongs in
 * the actual product. A deployed web app is already inside a real phone
 * (or a real browser window), and an app wrapped for the Play Store runs
 * full-screen with no browser chrome at all, so faking either one on top
 * of the real thing only gets in the way.
 *
 * What's kept: the floating customer support widget, which is real
 * functionality, not demo decoration.
 */
export default function AppShell({
  children,
  activeRole,
  currentUser,
  supportChats,
  onAddSupportMessage,
  onStartSupportSession,
}: AppShellProps) {
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
        {/* Floating Helpdesk Admin-Managed Support Launcher button */}
        <button
          onClick={() => setIsSupportOpen(true)}
          className="fixed bottom-20 left-4 z-40 w-12 h-12 bg-slate-900 dark:bg-slate-950 hover:bg-[#003D36] text-[#95C93D] rounded-full flex items-center justify-center shadow-2xl hover:shadow-emerald-500/10 active:scale-95 cursor-pointer hover:scale-105 duration-200 border border-[#95C93D]/30 group"
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
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex flex-col justify-end">
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
                    <span>Direct Line to TradeEase</span>
                  </p>
                  <p className="mt-0.5 opacity-90">
                    Messages here go straight to our support team, who can reply directly from the admin backoffice.
                  </p>
                </div>

                {!currentSession && !currentUser ? (
                  /* Guest Session Generator */
                  <div className="space-y-3.5 my-auto max-w-[280px] mx-auto text-center py-4">
                    <div className="text-gray-400 font-extrabold text-[11px] uppercase tracking-wider">Start support ticket</div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">
                      We can connect you with a support agent as a guest, or log in to tie it to your account.
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
                        const email = guestEmail.trim() || `guest-${Math.floor(1000 + Math.random() * 9000).toString()}@tradeease.ng`;
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
                      🔒 Secure support channel
                    </div>

                    {(currentSession?.messages || []).map((msg) => {
                      const isAdmin = msg.sender === 'admin';
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col max-w-[85%] ${isAdmin ? 'self-start items-start' : 'self-end items-end'}`}
                        >
                          <span className="text-[8.5px] text-gray-400 font-bold px-1.5 mb-1">
                            {isAdmin ? 'TradeEase Support' : msg.senderName}
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
                    placeholder="How can we help?"
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
    <div className="min-h-screen w-full bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-100 font-sans relative overflow-x-hidden">
      {children}
      {renderSupportWidget()}
    </div>
  );
}
