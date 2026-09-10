import { Router } from "express";
import { HistoryController } from "../controllers/history.controller";

const router = Router();

router.get("/import-history", HistoryController.getImportHistory);
router.get("/audit-log", HistoryController.getAuditLog);

export default router;
