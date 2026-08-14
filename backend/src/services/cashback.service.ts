import { Transaction, Wallet, CustomerCashbackSummary } from '../models/index.js';
import { CASHBACK_SOURCE, RATE_TYPE, CASHBACK_TYPE } from '../utils/constants.js';
import { calculateCashback, roundCurrency } from '../utils/helpers.js';
import { joinQueue } from './queue.service.js';

export async function createCashbackEntry({
  userId,
  storeId = '',
  storeName = '',
  storeUrl = '',
  orderId,
  orderAmount,
  cashbackAmount,
  rate = 0,
  rateType = RATE_TYPE.PERCENT,
  source = CASHBACK_SOURCE.MANUAL,
  clickId = '',
  type = CASHBACK_TYPE.PURCHASE,
  metadata = {},
}: {
  userId: any;
  storeId?: string;
  storeName?: string;
  storeUrl?: string;
  orderId: string;
  orderAmount: number;
  cashbackAmount: number;
  rate?: number;
  rateType?: string;
  source?: string;
  clickId?: string;
  type?: string;
  metadata?: any;
}) {
  const orderAmountNum = roundCurrency(Number(orderAmount) || 0);

  let finalCashback = roundCurrency(Number(cashbackAmount) || 0);
  if (!finalCashback && rate > 0) {
    finalCashback = calculateCashback(orderAmountNum, rate, rateType);
  }

  const txn = await Transaction.create({
    user: userId,
    orderId,
    storeId,
    storeName,
    orderAmount: orderAmountNum,
    cashbackAmount: finalCashback,
    source,
    trackedAt: new Date(),
  });

  const entry = await joinQueue({
    user: userId,
    transaction: txn._id,
    storeId,
    storeName,
    storeUrl,
    orderId,
    orderAmount: orderAmountNum,
    cashbackAmount: finalCashback,
    rate,
    rateType,
    type,
    source,
    clickId,
    metadata,
  });

  txn.queueItem = entry._id;
  await txn.save();

  await Wallet.findOneAndUpdate(
    { user: userId },
    { $inc: { totalPending: finalCashback } },
    { upsert: true },
  );

  await CustomerCashbackSummary.findOneAndUpdate(
    { user: userId },
    { $inc: { totalOrders: 1, totalOrderValue: orderAmountNum, totalPending: finalCashback } },
    { upsert: true },
  );

  return entry;
}
