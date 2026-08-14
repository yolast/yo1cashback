import { Router } from 'express';
import { getWallet, getWalletTransactions } from '../controllers/wallet.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getWallet);
router.get('/transactions', getWalletTransactions);

export default router;
