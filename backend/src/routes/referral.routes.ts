import { Router } from 'express';
import { getReferralSummary, listReferrals, validateReferralCode } from '../controllers/referral.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.get('/code/:code', validateReferralCode);
router.get('/', authenticate, getReferralSummary);
router.get('/list', authenticate, listReferrals);

export default router;
