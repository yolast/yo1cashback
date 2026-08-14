import { Router } from 'express';
import { body } from 'express-validator';
import { getStats, listQueue, updateQueueItemStatus, createQueueEntry, listTickets } from '../controllers/admin.controller.js';
import { listUsers, getUserById, updateUserStatus } from '../controllers/user.controller.js';
import { listAllWithdrawals, processWithdrawal } from '../controllers/withdrawal.controller.js';
import { updateTicketStatus } from '../controllers/ticket.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { requireAdmin } from '../middlewares/admin.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/stats', getStats);

router.get('/users', listUsers);
router.get('/users/:id', getUserById);
router.patch('/users/:id/status', updateUserStatus);

router.get('/queue', listQueue);
router.patch('/queue/:id', updateQueueItemStatus);
router.post(
  '/queue',
  [body('userId').isMongoId(), body('orderId').isString().notEmpty(), body('orderAmount').isNumeric()],
  validate,
  createQueueEntry,
);

router.get('/withdrawals', listAllWithdrawals);
router.patch('/withdrawals/:id', processWithdrawal);

router.get('/tickets', listTickets);
router.patch('/tickets/:id', updateTicketStatus);

export default router;
