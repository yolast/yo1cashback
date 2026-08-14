import { WithdrawalRequest, Wallet, CustomerCashbackSummary } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buildPagination, roundCurrency } from '../utils/helpers.js';
import { WITHDRAWAL_STATUS } from '../utils/constants.js';
import config from '../config/index.js';
import { notify } from '../services/session.service.js';
import { getSettingsMap } from '../services/settings.service.js';

export const requestWithdrawal = asyncHandler(async (req, res) => {
  const { amount, upiId, remarks } = req.body;

  if (!amount || amount <= 0) throw ApiError.badRequest('A valid amount is required');
  if (!upiId || !/^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(upiId)) {
    throw ApiError.badRequest('A valid UPI ID is required (e.g. name@bank)');
  }

  const settings = await getSettingsMap();
  const minWithdrawal = Number(settings.minWithdrawal ?? config.cashback.minWithdrawal);
  const maxWithdrawal = Number(settings.maxWithdrawal ?? config.cashback.maxWithdrawal ?? 0);

  if (amount < minWithdrawal) {
    throw ApiError.badRequest(`Minimum withdrawal is ${minWithdrawal}`);
  }
  if (maxWithdrawal > 0 && amount > maxWithdrawal) {
    throw ApiError.badRequest(`Maximum withdrawal is ${maxWithdrawal}`);
  }

  const wallet = await Wallet.findOne({ user: req.user._id });
  const balance = wallet?.balance || 0;
  if (amount > balance) throw ApiError.badRequest('Insufficient balance');

  const fee = 0;
  const netAmount = roundCurrency(amount - fee);

  const withdrawal = await WithdrawalRequest.create({
    user: req.user._id,
    amount: roundCurrency(amount),
    upiId,
    remarks: remarks || '',
    fee,
    netAmount,
    method: 'upi',
    status: WITHDRAWAL_STATUS.PENDING,
    statusHistory: [{ status: WITHDRAWAL_STATUS.PENDING, at: new Date() }],
  });

  await Wallet.findOneAndUpdate({ user: req.user._id }, { $inc: { balance: -amount } });

  await notify(req.user._id, {
    title: 'Withdrawal requested',
    body: `Your withdrawal of ${netAmount.toFixed(2)} has been submitted and is pending review.`,
    type: 'withdrawal',
    data: { withdrawal: withdrawal._id },
  });

  return res.status(201).json({ success: true, data: withdrawal });
});

export const listMyWithdrawals = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req.query);
  const [withdrawals, total] = await Promise.all([
    WithdrawalRequest.find({ user: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    WithdrawalRequest.countDocuments({ user: req.user._id }),
  ]);
  return res.status(200).json({
    success: true,
    data: withdrawals,
    meta: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const listAllWithdrawals = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req.query);
  const { status } = req.query;
  const filter = status ? { status } : {};

  const [withdrawals, total] = await Promise.all([
    WithdrawalRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('user', 'name email phone'),
    WithdrawalRequest.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: withdrawals,
    meta: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const processWithdrawal = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const withdrawal = await WithdrawalRequest.findById(req.params.id);
  if (!withdrawal) throw ApiError.notFound('Withdrawal not found');

  if (status === WITHDRAWAL_STATUS.APPROVED) {
    withdrawal.status = WITHDRAWAL_STATUS.APPROVED;
  } else if (status === WITHDRAWAL_STATUS.PAID) {
    withdrawal.status = WITHDRAWAL_STATUS.PAID;
    withdrawal.processedAt = new Date();
    await Wallet.findOneAndUpdate(
      { user: withdrawal.user },
      { $inc: { totalWithdrawn: withdrawal.amount } },
      { upsert: true },
    );
    await CustomerCashbackSummary.findOneAndUpdate(
      { user: withdrawal.user },
      { $inc: { totalWithdrawn: withdrawal.amount } },
      { upsert: true },
    );
  } else if (status === WITHDRAWAL_STATUS.REJECTED) {
    withdrawal.status = WITHDRAWAL_STATUS.REJECTED;
    await Wallet.findOneAndUpdate(
      { user: withdrawal.user },
      { $inc: { balance: withdrawal.amount } },
      { upsert: true },
    );
  } else {
    throw ApiError.badRequest('Unsupported status transition');
  }

  if (note) withdrawal.note = note;
  withdrawal.statusHistory.push({
    status: withdrawal.status,
    note: note || '',
    by: req.user._id,
    at: new Date(),
  });
  await withdrawal.save();

  await notify(withdrawal.user, {
    title: `Withdrawal ${status}`,
    body: note || `Your withdrawal request was marked ${status}.`,
    type: 'withdrawal',
    data: { withdrawal: withdrawal._id },
  });

  return res.status(200).json({ success: true, data: withdrawal });
});
