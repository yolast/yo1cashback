import bcrypt from 'bcryptjs';
import { verifyFirebaseToken } from '../config/firebase.js';
import { Admin, User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { signAccessToken, signRefreshToken } from '../middlewares/auth.js';
import { ensureReferralCode, applyReferral } from '../services/referral.service.js';
import { recordLogin, createSession } from '../services/session.service.js';
import { getOrCreateWallet } from '../services/wallet.service.js';
import { isLegacyConfigured, findLegacyUser } from '../services/legacy.service.js';
import { generateCustomerId } from '../utils/helpers.js';
import config from '../config/index.js';
import logger from '../utils/logger.js';

export const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw ApiError.badRequest('Email and password are required');

  const reqInfo = { ip: req.ip || '', userAgent: req.headers['user-agent'] || '' };

  const admin = await Admin.findOne({ email: String(email).toLowerCase() });
  if (!admin || !admin.passwordHash) {
    await recordLogin({ email: String(email).toLowerCase(), method: 'email', ...reqInfo, success: false, reason: 'Invalid email' });
    throw ApiError.unauthorized('Invalid email or password');
  }

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) {
    await recordLogin({ admin, email: admin.email, method: 'email', ...reqInfo, success: false, reason: 'Wrong password' });
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (admin.isActive === false) throw ApiError.forbidden('Account is disabled');

  admin.lastLoginAt = new Date();
  await admin.save();
  await recordLogin({ admin, email: admin.email, method: 'email', ...reqInfo, success: true });

  return res.status(200).json({
    success: true,
    data: {
      user: serializeAdmin(admin),
      tokens: { accessToken: signAccessToken(admin, 'admin'), refreshToken: signRefreshToken(admin, 'admin') },
    },
  });
});

export const firebaseAuth = asyncHandler(async (req, res) => {
  const { idToken, referralCode, name, method = 'google' } = req.body;

  if (!idToken) throw ApiError.badRequest('Firebase idToken is required');

  const decoded = await verifyFirebaseToken(idToken);
  const { uid, email, phone_number: phone, picture } = decoded;

  const reqInfo = { ip: req.ip || '', userAgent: req.headers['user-agent'] || '' };

  // Restriction: no new registrations — only users already registered in the YOlast.com
  // database may log in. If the legacy DB is configured, the user must exist there.
  if (isLegacyConfigured()) {
    try {
      const legacyUser = await findLegacyUser({ phone, email, firebaseUid: uid });
      if (!legacyUser) {
        await recordLogin({ email, method, ...reqInfo, success: false, reason: 'Not registered in YOlast DB' });
        throw ApiError.unauthorized('This account is not registered with YO1Cashback. Please contact support.');
      }
    } catch (err) {
      if (err instanceof ApiError) throw err;
      logger.error(`Legacy user verification failed: ${(err as Error).message}`);
      throw ApiError.unauthorized('Unable to verify your account against YOlast.com. Please try again later.');
    }
  } else {
    logger.warn('LEGACY_DB_URI not configured — login allowed without YOlast.com user verification');
  }

  let user = await User.findOne({ firebaseUid: uid });
  let isNew = !user;

  // Link an account that already exists for this phone (e.g. registered earlier via another provider).
  if (!user && phone) {
    user = await User.findOne({ phone });
    if (user) {
      user.firebaseUid = uid;
      isNew = false;
    }
  }

  if (!user) {
    user = await User.create({
      firebaseUid: uid,
      email: email || undefined,
      phone: phone || undefined,
      name: name || decoded.name || '',
      avatar: picture || '',
      role: 'customer',
      customerId: generateCustomerId(),
    });
  } else {
    if (email && !user.email) user.email = email;
    if (phone && !user.phone) user.phone = phone;
    if (!user.customerId) user.customerId = generateCustomerId();
    user.name = user.name || decoded.name || name || '';
    user.avatar = picture || user.avatar || '';
    user.lastLoginAt = new Date();
    await user.save();
  }

  await ensureReferralCode(user);
  if (isNew && referralCode) {
    await applyReferral(user, referralCode);
  }

  const wallet = await getOrCreateWallet(user._id);
  await recordLogin({ user, email: user.email, method, ...reqInfo, success: true });
  await createSession({ user, ...reqInfo });

  return res.status(200).json({
    success: true,
    data: {
      user: serializeUser(user, wallet),
      tokens: { accessToken: signAccessToken(user, 'user'), refreshToken: signRefreshToken(user, 'user') },
      isNew,
    },
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw ApiError.badRequest('refreshToken is required');

  const jwt = (await import('jsonwebtoken')).default;
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, config.jwt.secret);
  } catch {
    throw ApiError.unauthorized('Invalid refresh token');
  }
  if (decoded.tokenType !== 'refresh') throw ApiError.unauthorized('Invalid token type');

  if (decoded.type === 'admin') {
    const admin = await Admin.findById(decoded.sub);
    if (!admin || admin.isActive === false) throw ApiError.unauthorized('Account not found');
    return res.status(200).json({
      success: true,
      data: { accessToken: signAccessToken(admin, 'admin'), refreshToken: signRefreshToken(admin, 'admin') },
    });
  }

  const user = await User.findById(decoded.sub);
  if (!user || user.isActive === false) throw ApiError.unauthorized('Account not found');
  return res.status(200).json({
    success: true,
    data: { accessToken: signAccessToken(user, 'user'), refreshToken: signRefreshToken(user, 'user') },
  });
});

export const me = asyncHandler(async (req, res) => {
  if (req.entityType === 'admin') {
    return res.status(200).json({ success: true, data: serializeAdmin(req.user) });
  }
  const wallet = await getOrCreateWallet(req.user._id);
  return res.status(200).json({ success: true, data: serializeUser(req.user, wallet) });
});

export function serializeUser(user, wallet) {
  return {
    id: user._id,
    firebaseUid: user.firebaseUid,
    customerId: user.customerId,
    email: user.email || '',
    phone: user.phone || '',
    name: user.name,
    avatar: user.avatar,
    role: 'customer',
    balance: wallet?.balance ?? 0,
    totalEarned: wallet?.totalEarned ?? 0,
    totalPending: wallet?.totalPending ?? 0,
    totalWithdrawn: wallet?.totalWithdrawn ?? 0,
    referralCode: user.referralCode,
    referredBy: user.referredBy,
    payout: user.payout,
    createdAt: user.createdAt,
  };
}

export function serializeAdmin(admin) {
  return {
    id: admin._id,
    email: admin.email || '',
    name: admin.name,
    avatar: admin.avatar,
    role: 'superadmin',
    createdAt: admin.createdAt,
  };
}
