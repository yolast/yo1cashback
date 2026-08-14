import { validationResult } from 'express-validator';
import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError.js';

export function validate(req: Request, _res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map((e) => ({ field: (e as any).path, message: e.msg }));
    return next(ApiError.badRequest('Validation failed', details));
  }
  return next();
}

export default validate;
