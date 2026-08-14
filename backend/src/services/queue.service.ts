import { CashbackQueue, User, Wallet, CustomerCashbackSummary, Notification, Setting } from '../models/index.js';
import { CASHBACK_STATUS, CASHBACK_TYPE, CASHBACK_SOURCE, RATE_TYPE, NOTIFICATION_TYPE } from '../utils/constants.js';
import { roundCurrency } from '../utils/helpers.js';
import config from '../config/index.js';

async function nextPosition() {
  const counter = await Setting.findOneAndUpdate(
    { key: 'queueCounter' },
    { $inc: { value: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return counter.value || 1;
}

async function getSettingsMap(): Promise<Record<string, any>> {
  const docs = await Setting.find({});
  return docs.reduce<Record<string, any>>((acc, d) => ({ ...acc, [d.key]: d.value }), {});
}

export async function joinQueue(data) {
  const position = await nextPosition();
  return CashbackQueue.create({
    ...data,
    position,
    status: CASHBACK_STATUS.PENDING,
    trackedAt: data.trackedAt || new Date(),
  });
}

export async function getPosition(queueId) {
  const item = await CashbackQueue.findById(queueId);
  return item ? item.position : null;
}

export async function getNextEligible() {
  return CashbackQueue.findOne({ status: CASHBACK_STATUS.PENDING }).sort({ position: 1 });
}

export async function processQueue(queueId) {
  const item = await CashbackQueue.findById(queueId);
  if (!item) throw new Error('Queue item not found');
  if (item.status !== CASHBACK_STATUS.PENDING) {
    throw new Error(`Cannot process a ${item.status} item`);
  }

  item.status = CASHBACK_STATUS.PROCESSING;
  await item.save();

  await Notification.create({
    user: item.user,
    title: 'Cashback processing',
    body: `Your cashback of ${item.cashbackAmount.toFixed(2)} is now being processed.`,
    type: NOTIFICATION_TYPE.CASHBACK,
    data: { queueItem: item._id, orderId: item.orderId },
  });

  return item;
}

export async function updateQueueStatus(queueId, status, reason = '') {
  const item = await CashbackQueue.findById(queueId);
  if (!item) throw new Error('Queue item not found');

  if (status === CASHBACK_STATUS.PROCESSING) {
    return processQueue(queueId);
  }

  if (status === CASHBACK_STATUS.COMPLETED) {
    if (item.status === CASHBACK_STATUS.COMPLETED) return item;
    if (item.status !== CASHBACK_STATUS.PENDING && item.status !== CASHBACK_STATUS.PROCESSING) {
      throw new Error(`Cannot complete a ${item.status} item`);
    }

    item.status = CASHBACK_STATUS.COMPLETED;
    item.confirmedAt = new Date();
    await item.save();

    const amount = item.cashbackAmount;

    await Wallet.findOneAndUpdate(
      { user: item.user },
      { $inc: { balance: amount, totalEarned: amount, totalPending: -amount } },
      { upsert: true },
    );

    await CustomerCashbackSummary.findOneAndUpdate(
      { user: item.user },
      {
        $inc: { totalEarned: amount, totalCompleted: amount, totalPending: -amount },
        $set: { lastEarnedAt: new Date() },
      },
      { upsert: true },
    );

    await Notification.create({
      user: item.user,
      title: 'Cashback completed',
      body: `${amount.toFixed(2)} cashback from ${item.storeName || 'your order'} has been added to your wallet.`,
      type: NOTIFICATION_TYPE.CASHBACK,
      data: { queueItem: item._id, orderId: item.orderId },
    });

    if (item.type === CASHBACK_TYPE.PURCHASE) {
      await awardReferralBonus(item);
    }

    return item;
  }

  if (status === CASHBACK_STATUS.REJECTED) {
    if (item.status !== CASHBACK_STATUS.PENDING && item.status !== CASHBACK_STATUS.PROCESSING) {
      throw new Error(`Cannot reject a ${item.status} item`);
    }

    item.status = CASHBACK_STATUS.REJECTED;
    item.rejectedReason = reason;
    await item.save();

    await Wallet.findOneAndUpdate(
      { user: item.user },
      { $inc: { totalPending: -item.cashbackAmount } },
      { upsert: true },
    );

    await CustomerCashbackSummary.findOneAndUpdate(
      { user: item.user },
      { $inc: { totalPending: -item.cashbackAmount, totalRejected: item.cashbackAmount } },
      { upsert: true },
    );

    await Notification.create({
      user: item.user,
      title: 'Cashback rejected',
      body: `Cashback of ${item.cashbackAmount.toFixed(2)} for ${item.storeName || 'your order'} was rejected.`,
      type: NOTIFICATION_TYPE.CASHBACK,
      data: { queueItem: item._id, orderId: item.orderId, reason },
    });

    return item;
  }

  throw new Error(`Unsupported queue status: ${status}`);
}

export function getQueuePosition(item) {
  if (!item || (item.status !== CASHBACK_STATUS.PENDING && item.status !== CASHBACK_STATUS.PROCESSING)) {
    return null;
  }
  return item.position ?? null;
}

export async function getNextQueuePosition(userId) {
  const next = await CashbackQueue.findOne({
    user: userId,
    status: { $in: [CASHBACK_STATUS.PENDING, CASHBACK_STATUS.PROCESSING] },
  }).sort({ position: 1 });
  return next ? next.position : null;
}

async function awardReferralBonus(item) {
  const user = await User.findById(item.user);
  if (!user?.referredBy) return;

  const settings = await getSettingsMap();
  const bonusRate = Number(settings.referralBonusRate ?? config.cashback.referralBonusRate);
  const bonus = roundCurrency(item.cashbackAmount * (bonusRate / 100));
  if (bonus <= 0) return;

  const referrer = await User.findById(user.referredBy);
  if (!referrer) return;

  const orderId = `${item.orderId}-REF`;
  const existing = await CashbackQueue.findOne({ orderId });
  if (existing) return;

  await joinQueue({
    user: referrer._id,
    storeId: item.storeId,
    storeName: item.storeName,
    storeUrl: item.storeUrl,
    orderId,
    orderAmount: item.orderAmount,
    cashbackAmount: bonus,
    rate: bonusRate,
    rateType: RATE_TYPE.PERCENT,
    type: CASHBACK_TYPE.REFERRAL,
    status: CASHBACK_STATUS.COMPLETED,
    source: CASHBACK_SOURCE.REFERRAL,
    confirmedAt: new Date(),
  });

  await Wallet.findOneAndUpdate(
    { user: referrer._id },
    { $inc: { balance: bonus, totalEarned: bonus } },
    { upsert: true },
  );

  await CustomerCashbackSummary.findOneAndUpdate(
    { user: referrer._id },
    { $inc: { totalEarned: bonus, totalCompleted: bonus }, $set: { lastEarnedAt: new Date() } },
    { upsert: true },
  );

  await Notification.create({
    user: referrer._id,
    title: 'Referral bonus earned',
    body: `You earned ${bonus.toFixed(2)} referral bonus from a friend's purchase.`,
    type: NOTIFICATION_TYPE.REFERRAL,
    data: { orderId: item.orderId },
  });
}
