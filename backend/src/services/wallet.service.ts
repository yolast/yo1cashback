import { Wallet, CustomerCashbackSummary } from '../models/index.js';

export async function getOrCreateWallet(userId: any) {
  let wallet = await Wallet.findOne({ user: userId });
  if (!wallet) {
    wallet = await Wallet.create({ user: userId });
  }
  return wallet;
}

export async function getOrCreateSummary(userId: any) {
  let summary = await CustomerCashbackSummary.findOne({ user: userId });
  if (!summary) {
    summary = await CustomerCashbackSummary.create({ user: userId });
  }
  return summary;
}

export async function creditBalance(userId: any, amount: number, { type = 'balance' }: { type?: string } = {}) {
  const inc: Record<string, number> = {};
  if (type === 'balance') inc.balance = amount;
  if (type === 'pending') inc.totalPending = amount;
  if (type === 'earned') {
    inc.balance = amount;
    inc.totalEarned = amount;
  }
  if (type === 'withdrawn') inc.totalWithdrawn = amount;
  return Wallet.findOneAndUpdate({ user: userId }, { $inc: inc }, { new: true, upsert: true });
}

export default { getOrCreateWallet, getOrCreateSummary, creditBalance };
