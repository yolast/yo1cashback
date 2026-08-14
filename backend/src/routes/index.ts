import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import queueRoutes from './queue.routes.js';
import walletRoutes from './wallet.routes.js';
import transactionRoutes from './transaction.routes.js';
import withdrawalRoutes from './withdrawal.routes.js';
import referralRoutes from './referral.routes.js';
import notificationRoutes from './notification.routes.js';
import ticketRoutes from './ticket.routes.js';
import settingsRoutes from './settings.routes.js';
import postbackRoutes from './postback.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

router.get('/health', (_req, res) =>
  res.status(200).json({ success: true, message: 'YO1Cashback API is running', timestamp: new Date().toISOString() }),
);

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/queue', queueRoutes);
router.use('/wallet', walletRoutes);
router.use('/transactions', transactionRoutes);
router.use('/withdrawals', withdrawalRoutes);
router.use('/referrals', referralRoutes);
router.use('/notifications', notificationRoutes);
router.use('/tickets', ticketRoutes);
router.use('/settings', settingsRoutes);
router.use('/postback', postbackRoutes);
router.use('/admin', adminRoutes);

export default router;
