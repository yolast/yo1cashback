export const CASHBACK_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
} as const;

export const CASHBACK_TYPE = {
  PURCHASE: 'purchase',
  REFERRAL: 'referral',
  SIGNUP_BONUS: 'signup_bonus',
  ADJUSTMENT: 'adjustment',
} as const;

export const CASHBACK_SOURCE = {
  POSTBACK: 'postback',
  MANUAL: 'manual',
  TRACKED: 'tracked',
  REFERRAL: 'referral',
} as const;

export const WITHDRAWAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PAID: 'paid',
} as const;

export const WITHDRAWAL_METHODS = {
  UPI: 'upi',
  BANK: 'bank',
  PAYPAL: 'paypal',
  CRYPTO: 'crypto',
} as const;

export const RATE_TYPE = {
  PERCENT: 'percent',
  FIXED: 'fixed',
} as const;

export const ORDER_STATUS = {
  COMPLETED: 'completed',
  PROCESSING: 'processing',
  CANCELLED: 'cancelled',
  RETURNED: 'returned',
} as const;

export const ROLES = {
  SUPER_ADMIN: 'superadmin',
  CUSTOMER: 'customer',
} as const;

export const AUTH_METHODS = {
  PHONE: 'phone',
  GOOGLE: 'google',
} as const;

export const TICKET_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  CLOSED: 'closed',
} as const;

export const NOTIFICATION_TYPE = {
  CASHBACK: 'cashback',
  WITHDRAWAL: 'withdrawal',
  REFERRAL: 'referral',
  TICKET: 'ticket',
  SYSTEM: 'system',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export default {
  CASHBACK_STATUS,
  CASHBACK_TYPE,
  CASHBACK_SOURCE,
  WITHDRAWAL_STATUS,
  WITHDRAWAL_METHODS,
  RATE_TYPE,
  ORDER_STATUS,
  ROLES,
  AUTH_METHODS,
  TICKET_STATUS,
  NOTIFICATION_TYPE,
  PAGINATION,
};
