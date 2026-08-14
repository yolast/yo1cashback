import { CashbackQueue, Transaction } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buildPagination } from '../utils/helpers.js';
import { createCashbackEntry } from '../services/cashback.service.js';
import { getQueuePosition } from '../services/queue.service.js';
import { generateOrderId } from '../utils/helpers.js';

export const listMyQueue = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req.query);
  const { status, type } = req.query;
  const filter: Record<string, any> = { user: req.user._id };
  if (status) filter.status = status;
  if (type) filter.type = type;

  const [items, total] = await Promise.all([
    CashbackQueue.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    CashbackQueue.countDocuments(filter),
  ]);

  const data = await Promise.all(
    items.map(async (item) => {
      const queuePosition = await getQueuePosition(item);
      return { ...item.toObject(), queuePosition };
    }),
  );

  return res.status(200).json({
    success: true,
    data,
    meta: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const createQueueEntry = asyncHandler(async (req, res) => {
  const { storeId, storeName, storeUrl, orderId, orderAmount, cashbackAmount, rate, rateType, clickId } = req.body;

  if (!orderAmount && !cashbackAmount) {
    return res.status(400).json({ success: false, message: 'orderAmount or cashbackAmount is required' });
  }

  const entry = await createCashbackEntry({
    userId: req.user._id,
    storeId: storeId || '',
    storeName: storeName || '',
    storeUrl: storeUrl || '',
    orderId: orderId || generateOrderId(),
    orderAmount: Number(orderAmount) || 0,
    cashbackAmount: Number(cashbackAmount) || 0,
    rate: Number(rate) || 0,
    rateType,
    source: 'tracked',
    clickId: clickId || '',
  });

  return res.status(201).json({ success: true, data: entry });
});

export const listMyTransactions = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req.query);
  const { orderStatus } = req.query;
  const filter: Record<string, any> = { user: req.user._id };
  if (orderStatus) filter.orderStatus = orderStatus;

  const [transactions, total] = await Promise.all([
    Transaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Transaction.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: transactions,
    meta: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});
