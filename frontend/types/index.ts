export type UserRole = 'customer' | 'superadmin';

export interface User {
  id: string;
  firebaseUid: string;
  customerId?: string;
  email: string;
  phone?: string;
  name: string;
  avatar?: string;
  role: UserRole;
  balance: number;
  totalEarned: number;
  totalPending: number;
  totalWithdrawn: number;
  referralCode?: string;
  referredBy?: string | null;
  createdAt?: string;
}

export interface Wallet {
  _id: string;
  balance: number;
  totalEarned: number;
  totalPending: number;
  totalWithdrawn: number;
  currency: string;
}

export interface CashbackSummary {
  totalOrders: number;
  totalOrderValue: number;
  totalEarned: number;
  totalCompleted: number;
  totalPending: number;
  totalRejected: number;
  totalWithdrawn: number;
  lastEarnedAt?: string | null;
}

export type CashbackStatus = 'pending' | 'processing' | 'completed' | 'rejected';

export interface CashbackItem {
  _id: string;
  orderId: string;
  storeId?: string;
  storeName?: string;
  storeUrl?: string;
  orderAmount: number;
  cashbackAmount: number;
  rate: number;
  rateType: 'percent' | 'fixed';
  type: 'purchase' | 'referral' | 'signup_bonus' | 'adjustment';
  status: CashbackStatus;
  position?: number;
  source: 'postback' | 'manual' | 'tracked' | 'referral';
  confirmedAt?: string | null;
  rejectedReason?: string;
  trackedAt?: string;
  createdAt: string;
  queuePosition?: number | null;
}

export interface DashboardData {
  customerName: string;
  customerId: string;
  walletBalance: number;
  cashbackEarned: number;
  cashbackReceived: number;
  queuePosition: number | null;
  totalReferrals: number;
  wallet: Wallet;
  summary: CashbackSummary;
  pendingCount: number;
  recentCashback: CashbackItem[];
}

export type WithdrawalStatus = 'pending' | 'approved' | 'rejected' | 'paid';

export interface WithdrawalStatusEvent {
  status: WithdrawalStatus;
  note?: string;
  by?: string | null;
  at: string;
}

export interface Withdrawal {
  _id: string;
  user: string | { email: string; name: string; phone?: string };
  amount: number;
  upiId?: string;
  remarks?: string;
  fee: number;
  netAmount: number;
  method?: string;
  status: WithdrawalStatus;
  note?: string;
  statusHistory?: WithdrawalStatusEvent[];
  createdAt: string;
}

export interface ReferredUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
}

export interface ReferralData {
  code: string;
  totalReferees: number;
  totalEarned: number;
  referrals: ReferredUser[];
}

export interface AppNotification {
  _id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export interface Ticket {
  _id: string;
  subject: string;
  category: string;
  status: 'open' | 'in_progress' | 'closed';
  priority: string;
  lastMessageAt?: string;
  createdAt: string;
}

export interface TicketMessage {
  _id: string;
  ticket: string;
  sender: string;
  senderType: 'user' | 'admin';
  message: string;
  createdAt: string;
}

export interface TicketDetail {
  ticket: Ticket;
  messages: TicketMessage[];
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'superadmin';
  createdAt?: string;
}

export interface AdminStats {
  totalCustomers: number;
  totalCashbackPaid: number;
  totalPendingWithdrawals: number;
  totalQueueMembers: number;
  totalTickets: number;
  totalAdmins?: number;
  totalTransactions?: number;
  totalWithdrawn?: number;
  totalWalletBalance?: number;
}

export interface Setting {
  _id: string;
  key: string;
  value: string | number | boolean;
  description?: string;
}

export interface CustomerDetail {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  customerId?: string;
  referralCode?: string;
  isActive: boolean;
  createdAt: string;
  wallet: Wallet;
  summary: CashbackSummary;
}

export interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  customerId?: string;
  referralCode?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AdminTicket {
  _id: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  user: { name: string; email: string; phone?: string };
  createdAt: string;
}

export interface ApiListMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: ApiListMeta;
}
