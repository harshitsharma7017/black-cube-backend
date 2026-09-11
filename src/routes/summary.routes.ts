import { Router } from 'express';
import { SummaryController } from '../controllers/summary.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/', requireAuth, SummaryController.getSummary);

export default router;