import { Router } from 'express';
import { body } from 'express-validator';
import { requestWithdrawal, listMyWithdrawals } from '../controllers/withdrawal.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

router.use(authenticate);

router.post('/', [body('amount').isNumeric(), body('upiId').isString().notEmpty()], validate, requestWithdrawal);
router.get('/', listMyWithdrawals);

export default router;
