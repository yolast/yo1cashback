import { Router } from 'express';
import { receivePostback, cancelPostback } from '../controllers/postback.controller.js';

const router = Router();

router.post('/', receivePostback);
router.post('/cancel', cancelPostback);

export default router;
