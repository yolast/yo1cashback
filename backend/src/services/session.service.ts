import { CustomerSession, LoginLog, Notification } from '../models/index.js';
import { generateId } from '../utils/helpers.js';

interface LoginLogInput {
  user?: any;
  admin?: any;
  email?: string;
  method?: string;
  ip?: string;
  userAgent?: string;
  success?: boolean;
  reason?: string;
}

export async function recordLogin({ user, admin, email, method, ip, userAgent, success = true, reason = '' }: LoginLogInput) {
  await LoginLog.create({
    user: user?._id || null,
    admin: admin?._id || null,
    email: email || user?.email || admin?.email || '',
    method,
    ip: ip || '',
    userAgent: userAgent || '',
    success,
    reason,
  });
}

export async function createSession({ user, ip, userAgent, tokenJti = '' }: { user?: any; ip?: string; userAgent?: string; tokenJti?: string }) {
  const session = await CustomerSession.create({
    user: user?._id || null,
    sessionId: generateId(32),
    tokenJti,
    ip: ip || '',
    userAgent: userAgent || '',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
  return session;
}

export async function notify(userId: any, { title, body, type = 'system', data = {} }: { title: string; body?: string; type?: string; data?: any }) {
  return Notification.create({ user: userId, title, body, type, data });
}

export default { recordLogin, createSession, notify };
