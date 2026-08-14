import { CashbackQueue, WithdrawalRequest } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buildPagination } from '../utils/helpers.js';
import { getOrCreateWallet, getOrCreateSummary } from '../services/wallet.service.js';

export const getWallet = asyncHandler(async (req, res) => {
  const [wallet, summary] = await Promise.all([
    getOrCreateWallet(req.user._id),
    getOrCreateSummary(req.user._id),
  ]);

  return res.status(200).json({
    success: true,
    data: { wallet, summary },
  });
});

export const getWalletTransactions = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req.query);

  const [cashback, withdrawals] = await Promise.all([
    CashbackQueue.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(limit).skip(skip).lean(),
    WithdrawalRequest.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(limit).skip(skip).lean(),
  ]);

  const credits = cashback.map((c) => ({
    id: `cb-${c._id}`,
    type: 'cashback',
    label: c.storeName || 'Cashback',
    detail: c.orderId,
    amount: c.cashbackAmount,
    status: c.status,
    createdAt: c.createdAt,
  }));

  const debits = withdrawals.map((w) => ({
    id: `wd-${w._id}`,
    type: 'withdrawal',
    label: 'Withdrawal',
    detail: w.upiId || '',
    amount: w.amount,
    status: w.status,
    createdAt: w.createdAt,
  }));

  const transactions = [...credits, ...debits].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return res.status(200).json({
    success: true,
    data: transactions,
    meta: { page, limit, total: transactions.length },
  });
});
