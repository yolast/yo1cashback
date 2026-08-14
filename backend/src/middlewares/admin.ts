import { ApiError } from '../utils/ApiError.js';

export function requireAdmin(req, _res, next) {
  if (req.entityType !== 'admin' || req.user?.role !== 'superadmin') {
    return next(ApiError.forbidden('Super Admin access required'));
  }
  return next();
}

export default requireAdmin;
