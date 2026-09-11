import { Router } from 'express';
import { RecordController } from '../controllers/record.controller';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

router.get('/', requireAuth, RecordController.getRecords);
router.delete('/bulk', requireAuth, requireAdmin, RecordController.bulkDeleteRecords);
router.patch('/bulk', requireAuth, requireAdmin, RecordController.bulkUpdateRecords);
router.get('/export', requireAuth, requireAdmin, RecordController.exportRecords);
router.get('/:id', requireAuth, RecordController.getRecord);
router.patch('/:id', requireAuth, requireAdmin, RecordController.updateRecord);
router.delete('/:id', requireAuth, requireAdmin, RecordController.deleteRecord);

export default router;
