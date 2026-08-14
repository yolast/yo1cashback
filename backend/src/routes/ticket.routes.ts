import { Router } from 'express';
import { createTicket, listMyTickets, getTicket, addMessage } from '../controllers/ticket.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);

router.post('/', createTicket);
router.get('/', listMyTickets);
router.get('/:id', getTicket);
router.post('/:id/messages', addMessage);

export default router;
