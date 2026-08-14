import { Router } from 'express';
import { body } from 'express-validator';
import { firebaseAuth, refresh, me, adminLogin } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

router.post(
  '/admin/login',
  [
    body('email').isEmail().withMessage('A valid email is required'),
    body('password').isString().notEmpty().withMessage('Password is required'),
  ],
  validate,
  adminLogin,
);

router.post(
  '/firebase',
  [
    body('idToken').isString().notEmpty().withMessage('idToken is required'),
    body('referralCode').optional().isString(),
    body('name').optional().isString(),
    body('method').optional().isIn(['google', 'phone']),
  ],
  validate,
  firebaseAuth,
);

router.post('/refresh', [body('refreshToken').isString().notEmpty()], validate, refresh);
router.get('/me', authenticate, me);

export default router;
