import { isMaintenanceMode } from '../services/settings.service.js';

const ALLOWED_PREFIXES = ['/api/auth', '/api/admin', '/api/health', '/api/settings'];

let cache = { value: false, at: 0 };
const TTL = 10_000;

async function maintenanceEnabled() {
  const now = Date.now();
  if (now - cache.at < TTL) return cache.value;
  const value = await isMaintenanceMode();
  cache = { value, at: now };
  return value;
}

export async function maintenanceMiddleware(req, res, next) {
  const path = (req.originalUrl || req.url).split('?')[0];

  if (ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return next();
  }

  try {
    if (await maintenanceEnabled()) {
      return res.status(503).json({
        success: false,
        message: 'The platform is under maintenance. Please try again later.',
      });
    }
  } catch {
    // Fail open if settings are unavailable.
  }

  return next();
}

export default maintenanceMiddleware;
