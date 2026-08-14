import config from '../config/index.js';
import { ApiError } from '../utils/ApiError.js';
import logger from '../utils/logger.js';

export function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational !== false;

  if (!isOperational || statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} -> ${err.stack || err.message}`);
  }

  if (res.headersSent) {
    return undefined;
  }

  return res.status(statusCode).json({
    success: false,
    message: isOperational ? err.message : 'Internal server error',
    ...(err.details ? { details: err.details } : {}),
    ...(config.isProd ? {} : { stack: err.stack }),
  });
}
