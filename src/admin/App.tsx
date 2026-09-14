/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import * as api from '../api';
import { Product, Order, SupportChatSession, SupportMessage } from '../types';

// Backoffice Imports
import AdminLayout from '../components/AdminLayout';
import AdminLoginScreen from '../components/AdminLoginScreen';
import { AdminUser, AdminVendor } from '../components/AdminTypes';

export default function AdminApp() {
  const [adminSession, setAdminSession] = useState<{ id: string; name: string; level: string; email?: string; phone?: string } | null>(null);

  // Administrative Control Stores, now loaded from the REST API instead of local mock arrays.
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminVendors, setAdminVendors] = useState<AdminVendor[]>([]);

  // Dark Mode Setting
  const [darkMode, setDarkMode] = useState<boolean>(true);

  // Live Sync Stores from the backend
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [ordersList, setOrdersList] = useState<Order[]>([]);
  const [supportChats, setSupportChats] = useState<SupportChatSession[]>([]);

  // Load everything once authenticated as an admin, then poll for freshness.
  useEffect(() => {
    if (!adminSession) return;
    let cancelled = false;

    const refresh = async () => {
      try {
        const [products, orders, chats, users, vendors] = await Promise.all([
          api.getProducts(),
          api.getOrders(),
          api.getSupportChats(),
          api.getUsers(),
          api.getVendors(),
        ]);
        if (cancelled) return;
        setProductsList(products);
        setOrdersList(orders);
        setSupportChats(
          [...chats].sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
        );
        setAdminUsers(users);
        setAdminVendors(vendors);
      } catch (e) {
        console.error('Error loading admin data from API:', e);
      }
    };

    refresh();
    const interval = setInterval(refresh, 8000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [adminSession]);

  // Sync dark theme
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Support Communication Handlers
  const handleAddSupportMessage = async (sessionId: string, sender: 'user' | 'admin', senderName: string, content: string) => {
    try {
      const updatedChat = await api.addSupportMessage(sessionId, sender, senderName, content);
      setSupportChats(prev => prev.map(c => (c.id === sessionId ? updatedChat : c)));
    } catch (e) {
      console.error('Error sending support message:', e);
    }
  };

  const handleResolveSupportChat = async (sessionId: string) => {
    try {
      const updated = await api.resolveSupportChat(sessionId);
      setSupportChats(prev => prev.map(c => (c.id === sessionId ? updated : c)));
    } catch (e) {
      console.error('Error resolving support chat:', e);
    }
  };

  // Backoffice Operations
  const handleUpdateUserStatus = async (userId: string, newStatus: AdminUser['status']) => {
    try {
      const updated = await api.updateUserStatus(userId, newStatus);
      setAdminUsers(prev => prev.map(u => (u.id === userId ? updated : u)));
    } catch (e) {
      console.error('Error updating user status:', e);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await api.deleteUser(userId);
      setAdminUsers(prev => prev.filter(u => u.id !== userId));
    } catch (e) {
      console.error('Error deleting user:', e);
    }
  };

  const handleUpdateVendorStatus = async (vendorId: string, newStatus: AdminVendor['status']) => {
    try {
      const updated = await api.updateVendorStatus(vendorId, newStatus);
      setAdminVendors(prev => prev.map(v => (v.id === vendorId ? updated : v)));
    } catch (e) {
      console.error('Error updating vendor status:', e);
    }
  };

  // These upstream helpers keep local state in sync when a user/vendor is
  // created elsewhere in the admin UI (the records themselves are created via
  // the public /api/auth/register endpoint, so we just fold them into state here).
  const handleAddUserUpstream = (newUser: AdminUser) => {
    setAdminUsers(prev => [newUser, ...prev]);
  };

  const handleAddVendorUpstream = (newVendor: AdminVendor) => {
    setAdminVendors(prev => [newVendor, ...prev]);
  };

  const handleUpdateAdminSession = (newSession: { id: string; name: string; level: string; email?: string; phone?: string }) => {
    setAdminSession(newSession);
  };

  const handleRemoveCustomProduct = async (productIdToDelete: string) => {
    try {
      await api.adminDeleteProduct(productIdToDelete);
      setProductsList(prev => prev.map(p => (p.id === productIdToDelete ? { ...p, stock: 0 } : p)));
    } catch (e) {
      console.error('Error removing product:', e);
    }
  };

  const handleAddCustomProduct = async (newProduct: Product) => {
    try {
      const created = await api.adminCreateProduct(newProduct);
      setProductsList(prev => [created, ...prev]);
    } catch (e) {
      console.error('Error adding product:', e);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, updatedStatus: Order['status']) => {
    try {
      const updated = await api.adminUpdateOrderStatus(orderId, updatedStatus);
      setOrdersList(prev => prev.map(o => (o.id === orderId ? updated : o)));
    } catch (e) {
      console.error('Error updating order status:', e);
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-900 overflow-hidden text-gray-100 transition-colors duration-300 flex flex-col relative select-none">
      <AnimatePresence mode="wait">
        {!adminSession ? (
          <motion.div
            key="admin-login-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AdminLoginScreen
              onLoginSuccess={(session) => {
                setAdminSession({
                  ...session,
                  email: 'admin@tradeease.ng',
                  phone: '+234 1 0000 8888'
                });
              }}
              onBackToClient={() => {
                window.location.href = '/';
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="admin-workspace-layout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 w-full min-h-screen flex flex-col"
          >
            <AdminLayout
              adminSession={adminSession}
              onUpdateAdminSession={handleUpdateAdminSession}
              onAddUserUpstream={handleAddUserUpstream}
              onAddVendorUpstream={handleAddVendorUpstream}
              onBackToApp={() => {
                window.location.href = '/';
              }}
              productsList={productsList}
              ordersList={ordersList}
              onRemoveProductUpstream={handleRemoveCustomProduct}
              onUpdateOrderStatusUpstream={handleUpdateOrderStatus}
              onAddProductUpstream={handleAddCustomProduct}
              darkMode={darkMode}
              onThemeToggle={() => setDarkMode(!darkMode)}
              users={adminUsers}
              vendors={adminVendors}
              onUpdateUserStatus={handleUpdateUserStatus}
              onDeleteUser={handleDeleteUser}
              onUpdateVendorStatus={handleUpdateVendorStatus}
              supportChats={supportChats}
              onAddSupportMessage={handleAddSupportMessage}
              onResolveSupportChat={handleResolveSupportChat}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
