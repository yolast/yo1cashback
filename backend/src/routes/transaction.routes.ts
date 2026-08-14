import { Router } from 'express';
import { listMyTransactions } from '../controllers/queue.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.get('/', authenticate, listMyTransactions);

export default router;
