import { Router } from 'express';
import { SummaryController } from '../controllers/summary.controller';

const router = Router();

router.get('/', SummaryController.getSummary);

export default router;