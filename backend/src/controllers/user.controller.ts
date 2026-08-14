import { User, CashbackQueue } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getOrCreateWallet, getOrCreateSummary } from '../services/wallet.service.js';
import { getReferralStats } from '../services/referral.service.js';
import { getNextQueuePosition } from '../services/queue.service.js';

export const getProfile = asyncHandler(async (req, res) => {
  const wallet = await getOrCreateWallet(req.user._id);
  return res.status(200).json({
    success: true,
    data: {
      ...req.user.toObject(),
      id: req.user._id,
      balance: wallet.balance,
      totalEarned: wallet.totalEarned,
      totalPending: wallet.totalPending,
      totalWithdrawn: wallet.totalWithdrawn,
    },
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, email } = req.body;

  if (name !== undefined) req.user.name = name;

  if (phone !== undefined) {
    if (phone && !/^\+[1-9]\d{6,14}$/.test(phone)) {
      throw ApiError.badRequest('Invalid phone number format');
    }
    if (phone && phone !== req.user.phone) {
      const existing = await User.findOne({ phone, _id: { $ne: req.user._id } });
      if (existing) throw ApiError.conflict('Phone number is already in use');
    }
    req.user.phone = phone || undefined;
  }

  if (email !== undefined) {
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw ApiError.badRequest('Invalid email address');
    }
    if (email && email !== req.user.email) {
      const existing = await User.findOne({ email: email.toLowerCase(), _id: { $ne: req.user._id } });
      if (existing) throw ApiError.conflict('Email is already in use');
    }
    req.user.email = email ? email.toLowerCase() : undefined;
  }

  await req.user.save();
  return res.status(200).json({ success: true, data: req.user });
});

export const getDashboard = asyncHandler(async (req, res) => {
  const [wallet, summary, recentCashback, pendingCount, referralStats, queuePosition] = await Promise.all([
    getOrCreateWallet(req.user._id),
    getOrCreateSummary(req.user._id),
    CashbackQueue.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(10),
    CashbackQueue.countDocuments({ user: req.user._id, status: 'pending' }),
    getReferralStats(req.user._id),
    getNextQueuePosition(req.user._id),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      customerName: req.user.name,
      customerId: req.user.customerId,
      walletBalance: wallet.balance,
      cashbackEarned: wallet.totalEarned,
      cashbackReceived: summary.totalCompleted,
      queuePosition,
      totalReferrals: referralStats.referredUsers.length,
      wallet,
      summary,
      pendingCount,
      recentCashback,
    },
  });
});

export const listUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, q } = req.query;
  const filter = q
    ? {
        $or: [
          { email: { $regex: q, $options: 'i' } },
          { name: { $regex: q, $options: 'i' } },
          { phone: { $regex: q, $options: 'i' } },
          { customerId: { $regex: q, $options: 'i' } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit)),
    User.countDocuments(filter),
  ]);

  return res.status(200).json({ success: true, data: users, meta: { page: Number(page), limit: Number(limit), total } });
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  const wallet = await getOrCreateWallet(user._id);
  const summary = await getOrCreateSummary(user._id);
  return res.status(200).json({ success: true, data: { ...user.toObject(), wallet, summary } });
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  user.isActive = req.body.isActive ?? user.isActive;
  await user.save();
  return res.status(200).json({ success: true, data: user });
});
