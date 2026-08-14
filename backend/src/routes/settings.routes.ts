import { Router } from 'express';
import { getPublicSettings, getAllSettings, updateSetting } from '../controllers/settings.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { requireAdmin } from '../middlewares/admin.js';

const router = Router();

router.get('/', getPublicSettings);
router.get('/all', authenticate, requireAdmin, getAllSettings);
router.patch('/', authenticate, requireAdmin, updateSetting);

export default router;
