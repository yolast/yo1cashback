import { Router } from 'express';
import { body } from 'express-validator';
import { getDashboard, getProfile, updateProfile } from '../controllers/user.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

router.use(authenticate);

router.get('/me', getProfile);
router.get('/dashboard', getDashboard);
router.patch(
  '/profile',
  [
    body('name').optional().isString(),
    body('phone').optional().isString(),
    body('email').optional().isString(),
  ],
  validate,
  updateProfile,
);

export default router;
