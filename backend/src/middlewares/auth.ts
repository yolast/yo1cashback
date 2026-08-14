import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import config from '../config/index.js';
import { User, Admin } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export function signAccessToken(entity: any, type: 'user' | 'admin'): string {
  return jwt.sign(
    {
      sub: entity._id.toString(),
      uid: entity.firebaseUid || '',
      role: type === 'admin' ? 'superadmin' : 'customer',
      type,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.accessExpires } as SignOptions,
  );
}

export function signRefreshToken(entity: any, type: 'user' | 'admin'): string {
  return jwt.sign({ sub: entity._id.toString(), type, tokenType: 'refresh' }, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpires,
  } as SignOptions);
}

export async function loadEntity(sub: string, type: string) {
  if (type === 'admin') return Admin.findById(sub);
  return User.findById(sub);
}

export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw ApiError.unauthorized('Authentication required');

  let decoded: any;
  try {
    decoded = jwt.verify(token, config.jwt.secret);
  } catch {
    throw ApiError.unauthorized('Invalid or expired token');
  }

  if (decoded.tokenType === 'refresh') throw ApiError.unauthorized('Use an access token');

  const entity = await loadEntity(decoded.sub, decoded.type);
  if (!entity || entity.isActive === false) throw ApiError.unauthorized('Account not found or inactive');

  req.user = entity;
  req.entityType = decoded.type;
  req.role = decoded.role;
  req.token = decoded;
  next();
});

export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      const decoded: any = jwt.verify(token, config.jwt.secret);
      const entity = await loadEntity(decoded.sub, decoded.type);
      if (entity) {
        req.user = entity;
        req.entityType = decoded.type;
        req.role = decoded.role;
      }
    } catch {
      req.user = null;
    }
  }
  next();
});
