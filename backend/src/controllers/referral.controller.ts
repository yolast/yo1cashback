import { User } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getReferralStats } from '../services/referral.service.js';
import { buildPagination } from '../utils/helpers.js';

export const getReferralSummary = asyncHandler(async (req, res) => {
  const stats = await getReferralStats(req.user._id);
  return res.status(200).json({
    success: true,
    data: {
      code: req.user.referralCode,
      totalReferees: stats.referredUsers.length,
      totalEarned: stats.referralEarnings,
      referrals: stats.referredUsers,
    },
  });
});

export const listReferrals = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req.query);
  const [referrals, total] = await Promise.all([
    User.find({ referredBy: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('name email createdAt'),
    User.countDocuments({ referredBy: req.user._id }),
  ]);

  return res.status(200).json({
    success: true,
    data: referrals,
    meta: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const validateReferralCode = asyncHandler(async (req, res) => {
  const code = (req.params.code || '').toUpperCase();
  const referrer = await User.findOne({ referralCode: code });
  return res.status(200).json({ success: true, data: { valid: !!referrer, name: referrer?.name || '' } });
});
