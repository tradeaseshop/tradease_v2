import { Router } from 'express';
import authRoutes from './routes/auth';
import catalogRoutes from './routes/catalog';
import orderRoutes from './routes/orders';
import adminRoutes from './routes/admin';
import supportRoutes from './routes/support';
import webhookRoutes from './routes/webhooks';
import accountRoutes from './routes/account';
import paymentRoutes from './routes/payments';
import settingsRoutes from './routes/settings';
import reportRoutes from './routes/reports';
import kycRoutes from './routes/kyc';

const api = Router();

api.use('/auth', authRoutes);
api.use('/support-chats', supportRoutes);
api.use('/orders', orderRoutes);
api.use('/webhooks', webhookRoutes); // /webhooks/deliveri — inbound delivery status updates
api.use('/account', accountRoutes); // /account/export, DELETE /account
api.use('/payments', paymentRoutes); // /payments/config, /payments/verify
api.use('/settings', settingsRoutes); // platform-wide config
api.use('/reports', reportRoutes); // disputes / complaints
api.use('/kyc', kycRoutes); // vendor KYC document upload & admin review
api.use('/', adminRoutes); // /users, /vendors, /delivery-zones, /logistics-providers, /stats
api.use('/', catalogRoutes); // /categories, /products

export default api;
