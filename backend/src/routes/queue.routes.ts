import { Router } from 'express';
import { listMyQueue, createQueueEntry } from '../controllers/queue.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', listMyQueue);
router.post('/', createQueueEntry);

export default router;
