import { User, Wallet, CustomerCashbackSummary } from '../models/index.js';
import { generateReferralCode } from '../utils/helpers.js';

export async function ensureReferralCode(user) {
  if (user.referralCode) return user.referralCode;

  let code = generateReferralCode();
  let existing = await User.findOne({ referralCode: code });
  while (existing) {
    code = generateReferralCode();
    existing = await User.findOne({ referralCode: code });
  }

  user.referralCode = code;
  await user.save();
  return code;
}

export async function applyReferral(user, referralCode) {
  if (user.referredBy) return null;
  if (!referralCode) return null;

  const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
  if (!referrer || referrer._id.toString() === user._id.toString()) return null;

  user.referredBy = referrer._id;
  await user.save();
  return referrer;
}

export async function getReferralStats(userId) {
  const [referredUsers, earningsAgg, wallet] = await Promise.all([
    User.find({ referredBy: userId }).select('name email createdAt'),
    Wallet.aggregate([
      { $match: { user: userId } },
      { $group: { _id: null, earned: { $sum: '$totalEarned' } } },
    ]),
    Wallet.findOne({ user: userId }),
  ]);

  return {
    referredUsers,
    referralEarnings: earningsAgg.length ? earningsAgg[0].earned : 0,
    balance: wallet?.balance || 0,
  };
}

export async function getOrCreateSummary(userId) {
  return CustomerCashbackSummary.findOne({ user: userId });
}

export default { ensureReferralCode, applyReferral, getReferralStats, getOrCreateSummary };
