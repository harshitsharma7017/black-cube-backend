import { Router } from 'express';
import { RecordController } from '../controllers/record.controller';

const router = Router();

router.get('/', RecordController.getRecords);
router.get('/:id', RecordController.getRecord);
router.patch('/:id', RecordController.updateRecord);
router.delete('/:id', RecordController.deleteRecord);

export default router;
