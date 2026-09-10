import { Request, Response, NextFunction } from 'express';
import { RecordService } from '../services/record.service';
import { queryRecordsSchema, updateRecordSchema, bulkDeleteSchema, bulkUpdateSchema } from '../validators/record.validator';

export class RecordController {
  static async bulkDeleteRecords(req: Request, res: Response, next: NextFunction) {
    try {
      const data = bulkDeleteSchema.parse(req.body);
      const result = await RecordService.bulkDeleteRecords(data.ids);
      res.json({ data: { deletedCount: result.deletedCount }, error: null, meta: null });
    } catch (error: any) {
      if (error.name === "ZodError") {
        res.status(400).json({
          error: { code: "VALIDATION_ERROR", message: "Invalid bulk delete data", details: error.errors },
        });
        return;
      }
      next(error);
    }
  }

  static async bulkUpdateRecords(req: Request, res: Response, next: NextFunction) {
    try {
      const data = bulkUpdateSchema.parse(req.body);
      const result = await RecordService.bulkUpdateRecords(data.ids, data.updates);
      res.json({ data: { modifiedCount: result.modifiedCount }, error: null, meta: null });
    } catch (error: any) {
      if (error.name === "ZodError") {
        res.status(400).json({
          error: { code: "VALIDATION_ERROR", message: "Invalid bulk update data", details: error.errors },
        });
        return;
      }
      next(error);
    }
  }
  static async getRecords(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate query params
      const query = queryRecordsSchema.parse(req.query);

      // Fetch data
      const result = await RecordService.getRecords(query);

      // Return consistent format { data, error, meta }
      res.json({
        data: result.items,
        error: null,
        meta: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
        },
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: error.errors,
          },
        });
        return;
      }
      next(error);
    }
  }

  static async getRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const record = await RecordService.getRecordById(req.params.id as string);
      if (!record) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Record not found',
          },
        });
        return;
      }
      res.json({ data: record, error: null, meta: null });
    } catch (error) {
      next(error);
    }
  }

  static async updateRecord(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate body
      const data = updateRecordSchema.parse(req.body);

      // Check if trying to update protected fields
      if (Object.keys(data).length === 0) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'No valid fields provided to update',
          },
        });
        return;
      }

      const updatedRecord = await RecordService.updateRecord(req.params.id as string, data);
      
      if (!updatedRecord) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Record not found',
          },
        });
        return;
      }

      res.json({ data: updatedRecord, error: null, meta: null });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid update data',
            details: error.errors,
          },
        });
        return;
      }
      next(error);
    }
  }

  static async deleteRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const deletedRecord = await RecordService.deleteRecord(req.params.id as string);
      if (!deletedRecord) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Record not found',
          },
        });
        return;
      }
      res.json({ data: { success: true }, error: null, meta: null });
    } catch (error) {
      next(error);
    }
  }
}
