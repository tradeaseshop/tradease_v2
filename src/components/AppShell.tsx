import React, { useState, useRef, useEffect } from 'react';
import { Headphones, Send, X, ShieldAlert, Bell, CheckCheck, RefreshCw } from 'lucide-react';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../api';
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
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState('');
  const unreadCount = notifications.filter((item) => !item.isRead).length;

  const refreshNotifications = async () => {
    if (!currentUser) { setNotifications([]); return; }
    setNotificationsLoading(true); setNotificationsError('');
    try { setNotifications(await getNotifications()); }
    catch (error: any) { setNotificationsError(error?.message || 'Could not load notifications.'); }
    finally { setNotificationsLoading(false); }
  };
  useEffect(() => {
    void refreshNotifications();
    if (!currentUser) return;
    const timer = window.setInterval(() => { void refreshNotifications(); }, 30000);
    return () => window.clearInterval(timer);
  }, [currentUser?.id]);
  const readNotification = async (id: string) => {
    try { await markNotificationRead(id); setNotifications((items) => items.map((item) => item.id === id ? { ...item, isRead: true } : item)); }
    catch (error: any) { setNotificationsError(error?.message || 'Could not mark notification as read.'); }
  };
  const readAllNotifications = async () => {
    try { await markAllNotificationsRead(); setNotifications((items) => items.map((item) => ({ ...item, isRead: true }))); }
    catch (error: any) { setNotificationsError(error?.message || 'Could not mark notifications as read.'); }
  };

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
        {/* Floating Customer Support Launcher button */}
        <button
          onClick={() => setIsSupportOpen(true)}
          className="fixed bottom-24 right-4 z-40 w-12 h-12 bg-slate-900 dark:bg-slate-950 hover:bg-[#003D36] text-[#95C93D] rounded-full flex items-center justify-center shadow-2xl hover:shadow-emerald-500/10 active:scale-95 cursor-pointer hover:scale-105 duration-200 border border-[#95C93D]/30 group"
          title="Customer Support"
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
          <span className="absolute bottom-14 right-0 bg-slate-950 border border-[#95C93D]/20 text-[#95C93D] font-extrabold text-[8px] px-2.5 py-1 rounded-lg whitespace-nowrap shadow-md opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest pointer-events-none">
            Support
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
                      We usually reply within minutes
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
                      Start Chat
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
    <div className="h-dvh w-full bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-100 font-sans relative overflow-hidden">
      {children}
      <div className="fixed top-3 right-3 z-[60]">
        <button type="button" aria-label="Notifications" title="Notifications" onClick={() => { setNotificationsOpen((open) => !open); if (!notificationsOpen) void refreshNotifications(); }} className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#95C93D]/40 bg-[#003D36] text-[#95C93D] shadow-lg">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full border-2 border-[#003D36] bg-red-500 px-1 text-center text-[10px] font-black leading-4 text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>}
        </button>
        {notificationsOpen && <section role="dialog" aria-label="Notifications" className="absolute right-0 mt-2 flex max-h-[70dvh] w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl border border-emerald-900/20 bg-white text-slate-900 shadow-2xl dark:bg-slate-950 dark:text-white">
          <header className="flex items-center justify-between border-b border-slate-200 p-3 dark:border-slate-800">
            <div><h2 className="font-black">Notifications</h2><p className="text-xs opacity-60">Account, orders, payments and delivery updates</p></div>
            <div className="flex items-center gap-1"><button type="button" title="Refresh notifications" onClick={() => void refreshNotifications()} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><RefreshCw className={`h-4 w-4 ${notificationsLoading ? 'animate-spin' : ''}`} /></button><button type="button" title="Mark all as read" onClick={() => void readAllNotifications()} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><CheckCheck className="h-4 w-4" /></button><button type="button" title="Close notifications" onClick={() => setNotificationsOpen(false)} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-4 w-4" /></button></div>
          </header>
          {notificationsError && <p className="px-3 py-2 text-xs text-red-600">{notificationsError}</p>}
          {!currentUser ? <p className="p-5 text-sm">Sign in to view your notifications.</p> : notificationsLoading && notifications.length === 0 ? <p className="p-5 text-sm">Loading notifications…</p> : notifications.length === 0 ? <p className="p-5 text-sm opacity-60">You're all caught up. New account, order, payment and delivery updates will appear here.</p> : <div className="overflow-y-auto">{notifications.map((item) => <button type="button" key={item.id} onClick={() => { if (!item.isRead) void readNotification(item.id); }} className={`block w-full border-b border-slate-100 p-3 text-left dark:border-slate-800 ${item.isRead ? 'opacity-70' : 'bg-emerald-50 dark:bg-emerald-950/30'}`}><div className="flex items-start gap-2"><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${item.isRead ? 'bg-slate-300' : 'bg-emerald-500'}`} /><span className="min-w-0"><strong className="block text-sm">{item.title}</strong><span className="mt-1 block whitespace-normal text-xs leading-relaxed opacity-80">{item.message}</span><span className="mt-1 block text-[10px] uppercase tracking-wide opacity-50">{item.type || 'update'}</span></span></div></button>)}</div>}
        </section>}
      </div>
      {renderSupportWidget()}
    </div>
  );
}
