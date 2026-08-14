import { api, adminApi } from '@/lib/axios';
import type {
  AdminStats,
  AdminTicket,
  AdminUser,
  AppNotification,
  CashbackItem,
  Customer,
  CustomerDetail,
  DashboardData,
  ReferralData,
  Setting,
  Ticket,
  TicketDetail,
  TicketMessage,
  User,
  Wallet,
  CashbackSummary,
  Withdrawal,
} from '@/types';

function unwrap<T>(res: { data: { data: T } }): T {
  return res.data.data;
}

// ===== Auth =====
export const authService = {
  exchangeFirebaseToken: (idToken: string, method: string, referralCode?: string) =>
    api.post('/auth/firebase', { idToken, method, referralCode }).then((r) => unwrap<{ tokens: { accessToken: string; refreshToken: string } }>(r)),
  me: () => api.get('/auth/me').then((r) => unwrap<User>(r)),
  adminLogin: (email: string, password: string) =>
    adminApi.post('/auth/admin/login', { email, password }).then((r) => unwrap<{ user: AdminUser; tokens: { accessToken: string; refreshToken: string } }>(r)),
  adminMe: () => adminApi.get('/auth/me').then((r) => unwrap<AdminUser>(r)),
};

// ===== Users =====
export const userService = {
  dashboard: () => api.get('/users/dashboard').then((r) => unwrap<DashboardData>(r)),
  updateProfile: (payload: { name?: string; phone?: string; email?: string }) =>
    api.patch('/users/profile', payload),
};

// ===== Queue =====
export const queueService = {
  list: (params = '') => api.get(`/queue${params}`).then((r) => unwrap<CashbackItem[]>(r)),
  create: (payload: Record<string, unknown>) => api.post('/queue', payload),
};

// ===== Wallet =====
export const walletService = {
  get: () => api.get('/wallet').then((r) => unwrap<{ wallet: Wallet; summary: CashbackSummary }>(r)),
  transactions: () =>
    api.get('/wallet/transactions').then(
      (r) =>
        unwrap<
          { id: string; type: string; label: string; detail: string; amount: number; status: string; createdAt: string }[]
        >(r),
    ),
};

// ===== Withdrawals =====
export const withdrawalService = {
  list: () => api.get('/withdrawals').then((r) => unwrap<Withdrawal[]>(r)),
  request: (payload: { amount: number; upiId: string; remarks?: string }) => api.post('/withdrawals', payload),
};

// ===== Referrals =====
export const referralService = {
  summary: () => api.get('/referrals').then((r) => unwrap<ReferralData>(r)),
};

// ===== Tickets =====
export const ticketService = {
  list: () => api.get('/tickets').then((r) => unwrap<Ticket[]>(r)),
  create: (payload: { subject: string; category?: string; message: string }) => api.post('/tickets', payload),
  get: (id: string) => api.get(`/tickets/${id}`).then((r) => unwrap<TicketDetail>(r)),
  reply: (id: string, message: string) => api.post(`/tickets/${id}/messages`, { message }),
};

// ===== Notifications =====
export const notificationService = {
  list: () => api.get('/notifications').then((r) => unwrap<AppNotification[]>(r)),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

// ===== Settings =====
export const settingsService = {
  public: () => api.get('/settings'),
  all: () => adminApi.get('/settings/all').then((r) => unwrap<Setting[]>(r)),
  update: (key: string, value: unknown) => adminApi.patch('/settings', { key, value }),
};

// ===== Admin =====
export const adminService = {
  stats: () => adminApi.get('/admin/stats').then((r) => unwrap<AdminStats>(r)),
  queue: () => adminApi.get('/admin/queue?limit=200').then((r) => unwrap<CashbackItem[]>(r)),
  updateQueueItem: (id: string, status: string) => adminApi.patch(`/admin/queue/${id}`, { status }),
  withdrawals: () => adminApi.get('/admin/withdrawals?limit=100').then((r) => unwrap<Withdrawal[]>(r)),
  updateWithdrawal: (id: string, status: string) => adminApi.patch(`/admin/withdrawals/${id}`, { status }),
  users: (q = '') => adminApi.get(`/admin/users?limit=200${q ? `&q=${encodeURIComponent(q)}` : ''}`).then((r) => unwrap<Customer[]>(r)),
  user: (id: string) => adminApi.get(`/admin/users/${id}`).then((r) => unwrap<CustomerDetail>(r)),
  updateUserStatus: (id: string, isActive: boolean) => adminApi.patch(`/admin/users/${id}/status`, { isActive }),
  tickets: () => adminApi.get('/admin/tickets?limit=100').then((r) => unwrap<AdminTicket[]>(r)),
  updateTicket: (id: string, status: string) => adminApi.patch(`/admin/tickets/${id}`, { status }),
  ticketThread: (id: string) =>
    adminApi.get(`/tickets/${id}`).then((r) => unwrap<{ ticket: AdminTicket; messages: TicketMessage[] }>(r)),
  replyTicket: (id: string, message: string) => adminApi.post(`/tickets/${id}/messages`, { message }),
};

export { api, adminApi };
