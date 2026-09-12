/**
 * REST API client for the TradeEase backend (backend/), which replaces the
 * previous Firebase/Firestore data layer. All requests go to /api/* on the
 * same origin (see server.ts), so no base URL configuration is needed.
 */
import { Product, Category, Order, LogisticsProvider, UserSession } from './types';
import { AdminUser, AdminVendor } from './components/AdminTypes';

const TOKEN_KEY = 'tradeease_token';
const ADMIN_TOKEN_KEY = 'tradeease_admin_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}
export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}
export function setAdminToken(token: string | null) {
  if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token);
  else localStorage.removeItem(ADMIN_TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}, useAdminToken = false): Promise<T> {
  const token = useAdminToken ? getAdminToken() : getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, { ...options, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error((data && data.error) || `Request failed: ${res.status}`);
  }
  return data as T;
}

// Like request(), but for file uploads: no Content-Type header (the browser
// sets the correct multipart boundary itself) and no JSON body.
async function requestFormData<T>(path: string, formData: FormData, useAdminToken = false): Promise<T> {
  const token = useAdminToken ? getAdminToken() : getToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, { method: 'POST', headers, body: formData });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error((data && data.error) || `Upload failed: ${res.status}`);
  }
  return data as T;
}

// Fetches a protected file (e.g. a KYC document) with the right
// Authorization header attached, and returns a local blob URL that can be
// dropped straight into an <img src> or opened in a new tab. A plain <img>
// or <a> tag can't attach an auth header on its own, so this is the only
// way to view something behind requireRole() without leaking the JWT into
// a URL (which query-string tokens would do, showing up in browser history
// and server logs).
export async function fetchProtectedFileUrl(path: string, useAdminToken = false): Promise<string> {
  const token = useAdminToken ? getAdminToken() : getToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`/api${path}`, { headers });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error((data && data.error) || `Could not load file: ${res.status}`);
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

// ---------- Auth ----------

export async function registerAccount(input: { name: string; email: string; phone?: string; password: string; role: 'buyer' | 'vendor' }) {
  const { token, user } = await request<{ token: string; user: UserSession }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  setToken(token);
  return user;
}

export async function loginAccount(email: string, password: string) {
  const { token, user } = await request<{ token: string; user: UserSession }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(token);
  return user;
}

// ---------- Google Sign-In ----------

export const getGoogleAuthConfig = () => request<{ configured: boolean; clientId: string | null }>('/auth/google/config');

export async function googleLogin(idToken: string, role?: 'buyer' | 'vendor') {
  const { token, user } = await request<{ token: string; user: UserSession }>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ idToken, role }),
  });
  setToken(token);
  return user;
}

export function logoutAccount() {
  setToken(null);
}

// ---------- Account data export & deletion ----------

export const exportAccountData = () => request<any>('/account/export');
export const deleteAccount = (password: string) =>
  request<{ success: boolean; message: string }>('/account', { method: 'DELETE', body: JSON.stringify({ password }) });

// ---------- Payments (Paystack) ----------

export const getPaymentConfig = () => request<{ configured: boolean; publicKey: string | null }>('/payments/config');
export const verifyPayment = (reference: string, expectedAmount: number) =>
  request<{ verified: boolean; reference: string; amountNaira: number; paidAt: string | null }>('/payments/verify', {
    method: 'POST',
    body: JSON.stringify({ reference, expectedAmount }),
  });

export async function adminLogin(email: string, password: string) {
  const { token, admin } = await request<{ token: string; admin: { id: string; name: string; level: string; email: string; phone: string } }>(
    '/auth/admin-login',
    { method: 'POST', body: JSON.stringify({ email, password }) }
  );
  setAdminToken(token);
  return admin;
}

// ---------- Catalog ----------

export const getCategories = () => request<Category[]>('/categories');
export const getProducts = () => request<Product[]>('/products');
export const createProduct = (product: Partial<Product>) =>
  request<Product>('/products', { method: 'POST', body: JSON.stringify(product) });
export const updateProduct = (id: string, product: Partial<Product>) =>
  request<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(product) });
export const deleteProduct = (id: string) => request<{ success: boolean }>(`/products/${id}`, { method: 'DELETE' });

// ---------- Orders ----------

export const getOrders = (vendorId?: string) => request<Order[]>(`/orders${vendorId ? `?vendorId=${vendorId}` : ''}`);
export const placeOrder = (order: Partial<Order>) =>
  request<Order>('/orders', { method: 'POST', body: JSON.stringify(order) });
export const updateOrderStatus = (id: string, status: Order['status']) =>
  request<Order>(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });

// ---------- Admin: users & vendors ----------

export const getUsers = () => request<AdminUser[]>('/users', {}, true);
export const updateUserStatus = (id: string, status: AdminUser['status']) =>
  request<AdminUser>(`/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }, true);
export const deleteUser = (id: string) => request<{ success: boolean }>(`/users/${id}`, { method: 'DELETE' }, true);

export const getVendors = () => request<AdminVendor[]>('/vendors', {}, true);
export const updateVendorStatus = (id: string, status: AdminVendor['status']) =>
  request<AdminVendor>(`/vendors/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }, true);

// Admin-token variants of the vendor-facing mutations above, for use from the
// admin backoffice (src/admin/App.tsx), which authenticates separately from
// the buyer/vendor session and stores its own token.
export const adminCreateProduct = (product: Partial<Product>) =>
  request<Product>('/products', { method: 'POST', body: JSON.stringify(product) }, true);
export const adminDeleteProduct = (id: string) => request<{ success: boolean }>(`/products/${id}`, { method: 'DELETE' }, true);
export const adminUpdateOrderStatus = (id: string, status: Order['status']) =>
  request<Order>(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }, true);
export const adminAddSupportMessage = (chatId: string, sender: 'user' | 'admin', senderName: string, content: string) =>
  request<any>(`/support-chats/${chatId}/messages`, { method: 'POST', body: JSON.stringify({ sender, senderName, content }) }, true);
export const adminResolveSupportChat = (chatId: string) =>
  request<any>(`/support-chats/${chatId}/resolve`, { method: 'PUT' }, true);

// ---------- Delivery zones & logistics providers ----------

export const getDeliveryZones = () => request<any[]>('/delivery-zones');
export const getAllDeliveryZones = () => request<any[]>('/delivery-zones/all', {}, true);
export const createDeliveryZone = (zone: { zoneName: string; fee: number; isFree?: boolean }) =>
  request<any>('/delivery-zones', { method: 'POST', body: JSON.stringify(zone) }, true);
export const updateDeliveryZone = (id: number, zone: Partial<{ zoneName: string; fee: number; isFree: boolean; isActive: boolean }>) =>
  request<any>(`/delivery-zones/${id}`, { method: 'PUT', body: JSON.stringify(zone) }, true);
export const deleteDeliveryZone = (id: number) =>
  request<{ success: boolean }>(`/delivery-zones/${id}`, { method: 'DELETE' }, true);

export const getLogisticsProviders = () => request<LogisticsProvider[]>('/logistics-providers');
export const createLogisticsProvider = (provider: Partial<LogisticsProvider>) =>
  request<LogisticsProvider>('/logistics-providers', { method: 'POST', body: JSON.stringify(provider) }, true);
export const updateLogisticsProvider = (id: string, provider: Partial<LogisticsProvider>) =>
  request<LogisticsProvider>(`/logistics-providers/${id}`, { method: 'PUT', body: JSON.stringify(provider) }, true);
export const deleteLogisticsProvider = (id: string) =>
  request<{ success: boolean }>(`/logistics-providers/${id}`, { method: 'DELETE' }, true);

// ---------- Support chats ----------

export const getSupportChats = () => request<any[]>('/support-chats');
export const startSupportSession = (userName: string, userEmail: string, userRole: 'buyer' | 'vendor', id?: string) =>
  request<any>('/support-chats', { method: 'POST', body: JSON.stringify({ userName, userEmail, userRole, id }) });
export const addSupportMessage = (chatId: string, sender: 'user' | 'admin', senderName: string, content: string) =>
  request<any>(`/support-chats/${chatId}/messages`, { method: 'POST', body: JSON.stringify({ sender, senderName, content }) });
export const resolveSupportChat = (chatId: string) =>
  request<any>(`/support-chats/${chatId}/resolve`, { method: 'PUT' });

// ---------- Admin dashboard stats ----------

export const getAdminStats = () => request<{ totalUsers: number; totalVendors: number; totalProducts: number; totalOrders: number; totalRevenue: number }>('/stats', {}, true);

// ---------- Platform settings ----------

export const getSettings = () => request<any>('/settings');
export const updateSettings = (settings: any) => request<any>('/settings', { method: 'PUT', body: JSON.stringify(settings) }, true);

// ---------- Disputes / reports ----------

export const getReports = () => request<any[]>('/reports', {}, true);
export const createReport = (report: { reporterName: string; subject: string; type: string; description?: string }) =>
  request<any>('/reports', { method: 'POST', body: JSON.stringify(report) }, true);
export const updateReportStatus = (id: string, status: 'Open' | 'Investigating' | 'Resolved') =>
  request<any>(`/reports/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }, true);

// ---------- Admin team management ----------

export const getAdminTeam = () => request<any[]>('/auth/admins', {}, true);
export const inviteAdmin = (admin: { name: string; email: string; password: string; level?: string; phone?: string }) =>
  request<any>('/auth/admins', { method: 'POST', body: JSON.stringify(admin) }, true);
export const removeAdmin = (id: string) => request<{ success: boolean }>(`/auth/admins/${id}`, { method: 'DELETE' }, true);
export const updateMyAdminProfile = (profile: { name?: string; phone?: string }) =>
  request<any>('/auth/admin/me', { method: 'PUT', body: JSON.stringify(profile) }, true);

// ---------- Vendor KYC verification ----------

export interface KycDocument {
  id: string;
  vendorId: string;
  docType: 'id' | 'address';
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  rejectionReason: string | null;
  uploadedAt: string;
  reviewedAt: string | null;
}

// Vendor: my own documents + overall verification status
export const getMyKyc = () =>
  request<{ kycStatus: 'Unverified' | 'Pending' | 'Verified' | 'Rejected'; documents: KycDocument[] }>('/kyc/mine');

// Vendor: upload (or replace) an ID or proof-of-address document
export const uploadKycDocument = (docType: 'id' | 'address', file: File) => {
  const formData = new FormData();
  formData.append('docType', docType);
  formData.append('document', file);
  return requestFormData<KycDocument>('/kyc/documents', formData);
};

// Either role: view the actual uploaded file (returns a blob URL, see fetchProtectedFileUrl)
export const getKycFileUrl = (documentId: string, asAdmin: boolean) =>
  fetchProtectedFileUrl(`/kyc/documents/${documentId}/file`, asAdmin);

// Admin: every vendor with at least one submitted document
export const getKycQueue = () =>
  request<Array<{ vendorId: string; vendorName: string; vendorEmail: string; kycStatus: string; documents: KycDocument[] }>>(
    '/kyc/queue',
    {},
    true
  );

// Admin: approve or reject a specific document (reason required on reject)
export const reviewKycDocument = (documentId: string, status: 'Approved' | 'Rejected', reason?: string) =>
  request<{ document: KycDocument; vendorKycStatus: string }>(
    `/kyc/documents/${documentId}/review`,
    { method: 'PUT', body: JSON.stringify({ status, reason }) },
    true
  );
