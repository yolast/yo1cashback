import { User, Wallet, CashbackQueue, Transaction, WithdrawalRequest, Ticket, Admin } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { CASHBACK_STATUS } from '../utils/constants.js';
import { createCashbackEntry } from '../services/cashback.service.js';
import { updateQueueStatus } from '../services/queue.service.js';
import { buildPagination } from '../utils/helpers.js';

export const getStats = asyncHandler(async (_req, res) => {
  const [
    totalCustomers,
    totalAdmins,
    totalTransactions,
    totalQueueMembers,
    totalCashbackPaid,
    totalPendingWithdrawals,
    totalWithdrawn,
    totalTickets,
    totalWalletBalance,
  ] = await Promise.all([
    User.countDocuments(),
    Admin.countDocuments(),
    Transaction.countDocuments(),
    CashbackQueue.countDocuments({ status: { $in: [CASHBACK_STATUS.PENDING, CASHBACK_STATUS.PROCESSING] } }),
    CashbackQueue.aggregate([
      { $match: { status: CASHBACK_STATUS.COMPLETED } },
      { $group: { _id: null, sum: { $sum: '$cashbackAmount' } } },
    ]),
    WithdrawalRequest.countDocuments({ status: 'pending' }),
    WithdrawalRequest.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, sum: { $sum: '$amount' } } },
    ]),
    Ticket.countDocuments(),
    Wallet.aggregate([{ $group: { _id: null, sum: { $sum: '$balance' } } }]),
  ]);

  const [recentUsers, recentCashback] = await Promise.all([
    User.find().sort({ createdAt: -1 }).limit(5).select('name email phone customerId createdAt'),
    CashbackQueue.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name email'),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      totalCustomers,
      totalCashbackPaid: totalCashbackPaid.length ? totalCashbackPaid[0].sum : 0,
      totalPendingWithdrawals,
      totalQueueMembers,
      totalTickets,
      totalAdmins,
      totalTransactions,
      totalWithdrawn: totalWithdrawn.length ? totalWithdrawn[0].sum : 0,
      totalWalletBalance: totalWalletBalance.length ? totalWalletBalance[0].sum : 0,
      recentUsers,
      recentCashback,
    },
  });
});

export const listQueue = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req.query);
  const { status, user } = req.query;
  const filter: Record<string, any> = {};
  if (status) filter.status = status;
  if (user) filter.user = user;

  const [items, total] = await Promise.all([
    CashbackQueue.find(filter).sort({ position: 1 }).skip(skip).limit(limit).populate('user', 'name email phone'),
    CashbackQueue.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: items,
    meta: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const updateQueueItemStatus = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;
  const item = await CashbackQueue.findById(req.params.id);
  if (!item) throw ApiError.notFound('Queue item not found');

  if (status === 'processing') await updateQueueStatus(item._id, 'processing');
  else if (status === 'completed') await updateQueueStatus(item._id, 'completed');
  else if (status === 'rejected') await updateQueueStatus(item._id, 'rejected', reason || '');
  else throw ApiError.badRequest('Only "processing", "completed", or "rejected" actions are supported');

  return res.status(200).json({ success: true, data: await CashbackQueue.findById(item._id) });
});

export const createQueueEntry = asyncHandler(async (req, res) => {
  const { userId, storeId, storeName, storeUrl, orderId, orderAmount, cashbackAmount, rate, rateType } = req.body;
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found');

  const entry = await createCashbackEntry({
    userId: user._id,
    storeId: storeId || '',
    storeName: storeName || '',
    storeUrl: storeUrl || '',
    orderId,
    orderAmount: Number(orderAmount) || 0,
    cashbackAmount: Number(cashbackAmount) || 0,
    rate: Number(rate) || 0,
    rateType,
    source: 'manual',
  });

  return res.status(201).json({ success: true, data: entry });
});

export const listTickets = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req.query);
  const { status } = req.query;
  const filter = status ? { status } : {};

  const [tickets, total] = await Promise.all([
    Ticket.find(filter).sort({ lastMessageAt: -1 }).skip(skip).limit(limit).populate('user', 'name email'),
    Ticket.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: tickets,
    meta: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});
