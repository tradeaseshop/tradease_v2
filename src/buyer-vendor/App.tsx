/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppState, UserRole, Product, CartItem, Order, UserSession, SupportChatSession, SupportMessage } from '../types';
import * as api from '../api';

// Component imports
import Splashscreen from '../components/Splashscreen';
import Walkthrough from '../components/Walkthrough';
import AuthScreen from '../components/AuthScreen';
import LocationSelector from '../components/LocationSelector';
import AppShell from '../components/AppShell';
import BuyerMode from '../components/BuyerMode';
import VendorMode from '../components/VendorMode';

export default function App() {
  // Navigation Flow State
  const [appState, setAppState] = useState<AppState>('splash');
  
  // Authenticated user store/profile session
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  
  // User Role Switch
  const [activeRole, setActiveRole] = useState<UserRole>('buyer');
  
  // Nigeria Delivery Coordinates
  const [userLocation, setUserLocation] = useState<{ state: string; city: string }>({
    state: '',
    city: ''
  });

  // Dark Mode Setting (defaults to dark theme for that premium aesthetic)
  const [darkMode, setDarkMode] = useState<boolean>(true);

  // Live Mutivendor Datastores (now backed by the REST API instead of Firestore)
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [ordersList, setOrdersList] = useState<Order[]>([]);
  const [cartList, setCartList] = useState<CartItem[]>([]);

  // Live Admin-Managed Support Channels State
  const [supportChats, setSupportChats] = useState<SupportChatSession[]>([]);

  // Load core datastores from the backend on mount, then poll periodically so
  // the app still feels "live" (mirrors the previous Firestore onSnapshot behavior).
  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      try {
        const [products, orders, chats] = await Promise.all([
          api.getProducts(),
          api.getOrders(),
          api.getSupportChats(),
        ]);
        if (cancelled) return;
        setProductsList(products);
        setOrdersList(orders);
        setSupportChats(
          [...chats].sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
        );
      } catch (e) {
        console.error('Error loading data from API:', e);
      }
    };

    refresh();
    const interval = setInterval(refresh, 8000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Returns synchronously (existing local chat id, or a freshly generated one) because
  // callers in AppShell (used by the support widget's session bootstrap) use the return value immediately. The actual
  // persistence happens in the background and reconciles state when it resolves.
  const handleStartSupportSession = (userEmail: string, userName: string, userRole: 'buyer' | 'vendor') => {
    const cleanEmail = (userEmail || 'guest@tradeease.ng').trim().toLowerCase();
    const existing = supportChats.find((chat) => chat.userEmail.trim().toLowerCase() === cleanEmail);
    if (existing) {
      if (existing.status === 'resolved') {
        setSupportChats((prev) =>
          prev.map((c) => (c.id === existing.id ? { ...c, status: 'active', lastMessageAt: new Date().toISOString() } : c))
        );
        api.startSupportSession(userName, cleanEmail, userRole, existing.id).catch((e) =>
          console.error('Error reactivating support session:', e)
        );
      }
      return existing.id;
    }

    const newId = `chat-${Date.now()}`;
    const newSession: SupportChatSession = {
      id: newId,
      userName: userName || 'Anonymous Client',
      userRole,
      userEmail: cleanEmail,
      status: 'active',
      lastMessageAt: new Date().toISOString(),
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'admin',
          senderName: 'TradeEase Support',
          content: `Hi ${userName || 'there'}! This is the live TradeEase customer helpdesk managed directly by our administrator backoffice. How can we support your trade operations in Nigeria today?`,
          timestamp: new Date().toISOString(),
        },
      ],
    };
    setSupportChats((prev) => [newSession, ...prev]);

    api
      .startSupportSession(userName, cleanEmail, userRole, newId)
      .then((serverChat) => {
        // Reconcile with the server's version (same id, since we supplied it).
        setSupportChats((prev) => prev.map((c) => (c.id === newId ? serverChat : c)));
      })
      .catch((e) => console.error('Error starting support session:', e));

    return newId;
  };

  const handleAddSupportMessage = async (sessionId: string, sender: 'user' | 'admin', senderName: string, content: string) => {
    // Optimistic local update so the message appears instantly.
    const optimisticMessage: SupportMessage = {
      id: `msg-local-${Date.now()}`,
      sender,
      senderName,
      content,
      timestamp: new Date().toISOString(),
    };
    setSupportChats((prev) =>
      prev.map((c) =>
        c.id === sessionId ? { ...c, lastMessageAt: optimisticMessage.timestamp, messages: [...c.messages, optimisticMessage] } : c
      )
    );
    try {
      const updatedChat = await api.addSupportMessage(sessionId, sender, senderName, content);
      setSupportChats((prev) => prev.map((c) => (c.id === sessionId ? updatedChat : c)));
    } catch (e) {
      console.error('Error sending support message:', e);
    }
  };

  // Apply visual configurations globally on tailwind wrapper
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // ----------------------------------------------------
  // Buyer Actions Handlers
  // ----------------------------------------------------
  
  const handleAddToCart = (productToRegister: Product) => {
    setCartList((prevCart) => {
      const existingCartIdx = prevCart.findIndex(item => item.product.id === productToRegister.id);
      if (existingCartIdx > -1) {
        const copy = [...prevCart];
        copy[existingCartIdx] = {
          ...copy[existingCartIdx],
          quantity: copy[existingCartIdx].quantity + 1
        };
        return copy;
      }
      return [...prevCart, { product: productToRegister, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (targetProductId: string) => {
    setCartList((prev) => prev.filter(item => item.product.id !== targetProductId));
  };

  const handleUpdateCartQuantity = (targetProductId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveFromCart(targetProductId);
      return;
    }
    setCartList((prev) => 
      prev.map(item => 
        item.product.id === targetProductId 
          ? { ...item, quantity: newQty } 
          : item
      )
    );
  };

  const handleClearCartItems = () => {
    setCartList([]);
  };

  const handlePlaceNewOrder = async (shippingDetails: { 
    buyerName: string; 
    buyerPhone: string; 
    state: string; 
    city: string; 
    address: string;
    shippingMethod?: string;
    shippingCost?: number;
    logisticsProviderId?: string;
    logisticsProviderName?: string;
    trackingNumber?: string;
    carrierStatus?: string;
    paymentMethod?: 'wallet' | 'bank' | 'card';
    paymentStatus?: 'Pending' | 'Paid' | 'Failed';
    paymentReference?: string;
  }) => {
    // Compile active cart details into a consolidated receipt order
    const newItems = cartList.map(item => ({
      productId: item.product.id,
      productTitle: item.product.title,
      price: item.product.price,
      quantity: item.quantity,
      image: item.product.image
    }));

    const totalCalculatedCost = cartList.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const costOfShipping = shippingDetails.shippingCost || 0;
    const finalTotalAmount = totalCalculatedCost + costOfShipping;

    // Deliberately not caught here — if this throws (e.g. the backend
    // rejects a card payment it couldn't verify), the caller (BuyerMode's
    // checkout form) needs to know, so it can show the shopper an error
    // instead of a false "order placed" success screen.
    const createdOrder = await api.placeOrder({
      buyerName: shippingDetails.buyerName,
      buyerPhone: shippingDetails.buyerPhone,
      state: shippingDetails.state,
      city: shippingDetails.city,
      address: shippingDetails.address,
      items: newItems,
      totalAmount: finalTotalAmount,
      shippingMethod: shippingDetails.shippingMethod,
      shippingCost: costOfShipping,
      logisticsProviderId: shippingDetails.logisticsProviderId,
      logisticsProviderName: shippingDetails.logisticsProviderName,
      trackingNumber: shippingDetails.trackingNumber,
      carrierStatus: shippingDetails.carrierStatus,
      paymentMethod: shippingDetails.paymentMethod,
      paymentStatus: shippingDetails.paymentStatus,
      paymentReference: shippingDetails.paymentReference,
    } as any);

    // Reflect the new order and decremented stock locally right away.
    setOrdersList((prev) => [createdOrder, ...prev]);
    setProductsList((prev) =>
      prev.map((p) => {
        const purchased = cartList.find((item) => item.product.id === p.id);
        return purchased ? { ...p, stock: Math.max(0, p.stock - purchased.quantity) } : p;
      })
    );
  };

  // ----------------------------------------------------
  // Vendor Actions Handlers
  // ----------------------------------------------------

  const handleAddCustomProduct = async (newProduct: Product) => {
    try {
      const created = await api.createProduct(newProduct);
      setProductsList((prev) => [created, ...prev]);
    } catch (e) {
      console.error('Error adding product:', e);
    }
  };

  const handleRemoveCustomProduct = async (productIdToDelete: string) => {
    try {
      await api.deleteProduct(productIdToDelete);
      setProductsList((prev) => prev.map((p) => (p.id === productIdToDelete ? { ...p, stock: 0 } : p)));
    } catch (e) {
      console.error('Error removing product:', e);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, updatedStatus: Order['status']) => {
    try {
      const updated = await api.updateOrderStatus(orderId, updatedStatus);
      setOrdersList((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    } catch (e) {
      console.error('Error updating order status:', e);
    }
  };

  // Switch Active role on the fly
  const handleToggleUserRole = () => {
    setActiveRole((prev) => (prev === 'buyer' ? 'vendor' : 'buyer'));
  };

  const locationCoordinatesLabel = userLocation.state && userLocation.city
    ? `${userLocation.city}, ${userLocation.state}`
    : '';

  return (
    <div className="w-full h-dvh bg-slate-100 dark:bg-slate-900 overflow-hidden text-gray-800 dark:text-gray-100 transition-colors duration-300 flex flex-col relative select-none">
      
      <AnimatePresence mode="wait">
        <motion.div
          key="client-portal-wrapper"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1 w-full flex flex-col justify-between"
        >
          <AnimatePresence mode="wait">
            {/* State A: Initial Premium Splash Screen */}
            {appState === 'splash' && (
              <motion.div
                key="splash-screen"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5 }}
                className="w-full h-dvh flex flex-col overflow-hidden relative bg-slate-950"
              >
                <Splashscreen onComplete={() => setAppState('walkthrough')} />
              </motion.div>
            )}

            {/* State B: Onboarding walkthrough carousel */}
            {appState === 'walkthrough' && (
              <motion.div
                key="walkthrough-screen"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.5 }}
                className="w-full h-dvh flex flex-col overflow-hidden relative bg-slate-900"
              >
                <Walkthrough onComplete={() => setAppState('location')} />
              </motion.div>
            )}

            {/* State B.2: Login screen — only shown when something the user is
                doing actually requires an account (e.g. checking out), not
                as a mandatory gate before they can even see the app. */}
            {appState === 'auth' && (
              <motion.div
                key="auth-screen"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.5 }}
                className="w-full h-dvh flex flex-col overflow-hidden relative bg-slate-950"
              >
                <AuthScreen
                  onAuthCompleted={(session) => {
                    setCurrentUser(session);
                    // Location was already picked on the way in for every
                    // real path that can reach this screen now, so return
                    // straight to the app instead of re-asking for it.
                    setAppState(locationCoordinatesLabel ? 'main' : 'location');
                  }}
                  onSkip={() => {
                    setAppState(locationCoordinatesLabel ? 'main' : 'location');
                  }}
                  onAdminSelected={() => {
                    window.location.href = '/admin';
                  }}
                />
              </motion.div>
            )}

            {/* State C: Nigeria location state selector */}
            {appState === 'location' && (
              <motion.div
                key="location-screen"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.5 }}
                className="w-full h-dvh flex flex-col overflow-hidden relative bg-slate-900"
              >
                <LocationSelector 
                  onLocationSelected={(loc) => {
                    setUserLocation(loc);
                    setAppState('main');
                  }} 
                />
              </motion.div>
            )}

            {/* State D: Core Application Platform (Switchable Roles) */}
            {appState === 'main' && (
              <motion.div
                key="main-app"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="w-full h-dvh"
              >
                <AppShell
                  activeRole={activeRole}
                  currentUser={currentUser}
                  supportChats={supportChats}
                  onAddSupportMessage={handleAddSupportMessage}
                  onStartSupportSession={handleStartSupportSession}
                >
                  {/* Main Core Router with transition animations */}
                  <AnimatePresence mode="wait">
                    {activeRole === 'buyer' ? (
                      <motion.div
                        key="buyer-mode-view"
                        initial={{ opacity: 0, x: -60 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 60 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 180 }}
                        className="w-full h-full"
                      >
                        <BuyerMode
                          products={productsList}
                          cart={cartList}
                          onAddToCart={handleAddToCart}
                          onRemoveFromCart={handleRemoveFromCart}
                          onUpdateCartQuantity={handleUpdateCartQuantity}
                          onClearCart={handleClearCartItems}
                          orders={ordersList}
                          onPlaceOrder={handlePlaceNewOrder}
                          onUpdateOrderStatus={handleUpdateOrderStatus}
                          location={userLocation}
                          onRoleToggle={handleToggleUserRole}
                          darkMode={darkMode}
                          onThemeToggle={() => setDarkMode(!darkMode)}
                          currentUser={currentUser}
                          onLogout={() => { api.logoutAccount(); setCurrentUser(null); }}
                          onTriggerLogin={() => setAppState('auth')}
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="vendor-mode-view"
                        initial={{ opacity: 0, x: 60 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -60 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 180 }}
                        className="w-full h-full"
                      >
                        <VendorMode
                          products={productsList}
                          onAddProduct={handleAddCustomProduct}
                          onRemoveProduct={handleRemoveCustomProduct}
                          orders={ordersList}
                          onUpdateOrderStatus={handleUpdateOrderStatus}
                          onRoleToggle={handleToggleUserRole}
                          location={userLocation}
                          currentUser={currentUser}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </AppShell>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
