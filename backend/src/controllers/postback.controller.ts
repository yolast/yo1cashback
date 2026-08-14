import { CashbackQueue, User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { CASHBACK_SOURCE, CASHBACK_STATUS } from '../utils/constants.js';
import { createCashbackEntry } from '../services/cashback.service.js';
import { updateQueueStatus } from '../services/queue.service.js';
import { generateOrderId } from '../utils/helpers.js';

export const receivePostback = asyncHandler(async (req, res) => {
  const { userId, firebaseUid, orderId, amount, storeId, storeName, storeUrl, cashbackAmount, rate, rateType, status } =
    req.body;

  let user = null;
  if (userId) user = await User.findById(userId);
  else if (firebaseUid) user = await User.findOne({ firebaseUid });
  if (!user) throw ApiError.notFound('User not found — provide a valid userId or firebaseUid');

  const txnOrderId = orderId || generateOrderId();

  const existing = await CashbackQueue.findOne({ orderId: txnOrderId });
  if (existing) {
    return res.status(200).json({ success: true, data: existing, duplicate: true });
  }

  if (status === 'cancelled' || status === 'rejected') {
    return res.status(200).json({ success: true, data: { skipped: true } });
  }

  const entry = await createCashbackEntry({
    userId: user._id,
    storeId: storeId || '',
    storeName: storeName || '',
    storeUrl: storeUrl || '',
    orderId: txnOrderId,
    orderAmount: Number(amount) || 0,
    cashbackAmount: Number(cashbackAmount) || 0,
    rate: Number(rate) || 0,
    rateType,
    source: CASHBACK_SOURCE.POSTBACK,
  });

  return res.status(201).json({ success: true, data: entry });
});

export const cancelPostback = asyncHandler(async (req, res) => {
  const { orderId, reason } = req.body;
  if (!orderId) throw ApiError.badRequest('orderId is required');

  const item = await CashbackQueue.findOne({ orderId });
  if (!item) throw ApiError.notFound('Cashback item not found');
  if (item.status === CASHBACK_STATUS.PENDING) {
    await updateQueueStatus(item._id, CASHBACK_STATUS.REJECTED, reason || 'Cancelled by network');
  }
  return res.status(200).json({ success: true, data: item });
});
