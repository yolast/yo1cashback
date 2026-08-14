import { customAlphabet } from 'nanoid';
import crypto from 'crypto';

const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

export const generateId = customAlphabet(alphabet, 12);

export function generateReferralCode(len = 8) {
  return customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', len)();
}

export function generateCustomerId() {
  return `YO1${customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8)()}`;
}

export function generateOrderId() {
  return `YO1-${Date.now().toString(36).toUpperCase()}-${generateId(6).toUpperCase()}`;
}

export function slugify(str) {
  return str
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function roundCurrency(value, decimals = 2) {
  return Math.round((Number(value) + Number.EPSILON) * 10 ** decimals) / 10 ** decimals;
}

export function calculateCashback(amount, rate, rateType) {
  if (rateType === 'fixed') return roundCurrency(rate);
  return roundCurrency(Number(amount) * (Number(rate) / 100));
}

export function buildPagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function signPostback(params, secret) {
  const payload = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}
