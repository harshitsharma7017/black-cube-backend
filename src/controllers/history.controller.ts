import { Request, Response, NextFunction } from "express";
import { ImportHistoryService } from "../services/import-history.service";
import { AuditLogService } from "../services/audit-log.service";
import { z } from "zod";

const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(10),
});

export class HistoryController {
  static async getImportHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, pageSize } = paginationSchema.parse(req.query);
      const result = await ImportHistoryService.getHistory(page, pageSize);
      res.json({
        data: result.items,
        error: null,
        meta: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Invalid pagination params" } });
        return;
      }
      next(error);
    }
  }

  static async getAuditLog(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, pageSize } = paginationSchema.parse(req.query);
      const result = await AuditLogService.getLogs(page, pageSize);
      res.json({
        data: result.items,
        error: null,
        meta: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Invalid pagination params" } });
        return;
      }
      next(error);
    }
  }
}
