import { Router } from 'express';
import { ImportController } from '../controllers/import.controller';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload';

const router = Router();

// POST /api/import/preview — multipart file upload → parse → validate → preview
router.post('/preview', requireAuth, requireAdmin, upload.single('file'), ImportController.preview);

// POST /api/import — JSON body of RecordInput[] → re-validate → bulk insert
router.post('/', requireAuth, requireAdmin, ImportController.commitImport);

export default router;
