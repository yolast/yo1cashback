import { ApiError } from '../utils/ApiError.js';

const buckets = new Map();

export function rateLimit({ windowMs = 60_000, max = 60, keyFn = (req) => req.ip }) {
  return (req, _res, next) => {
    const key = keyFn(req);
    const now = Date.now();
    const entry = buckets.get(key) || { count: 0, resetAt: now + windowMs };

    if (now > entry.resetAt) {
      entry.count = 0;
      entry.resetAt = now + windowMs;
    }

    entry.count += 1;
    buckets.set(key, entry);

    if (entry.count > max) {
      return next(ApiError.tooMany('Too many requests, please slow down'));
    }
    return next();
  };
}

export default rateLimit;
