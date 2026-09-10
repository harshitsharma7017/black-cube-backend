import { Request, Response, NextFunction } from 'express';
import { RecordService } from '../services/record.service';
import { queryRecordsSchema, updateRecordSchema, bulkDeleteSchema, bulkUpdateSchema, exportRecordsSchema } from '../validators/record.validator';
import * as xlsx from 'xlsx';
import { AuditLogService } from '../services/audit-log.service';
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
  
  static async exportRecords(req: Request, res: Response, next: NextFunction) {
    try {
      const query = exportRecordsSchema.parse(req.query);
      const items = await RecordService.getAllRecordsForExport(query);

      if (items.length === 0) {
        res.status(404).json({
          error: {
            code: "NOT_FOUND",
            message: "No records found matching criteria",
          },
        });
        return;
      }

      const mapped = items.map((item, index) => ({
        "S.N.": index + 1,
        "Name": item.name,
        "Email": item.email || "",
        "Phone No.": item.phoneNumber || "",
        "Address": item.address || "",
        "Organisation": item.organisation || "",
        "Type": item.type,
        "Link Status": item.linkStatus,
        "Download Status": item.downloadStatus,
        "Added On": item.dateAdded ? new Date(item.dateAdded).toLocaleString("en-GB") : "",
        "Record ID": item._id.toString()
      }));

      const wb = xlsx.utils.book_new();
      const ws = xlsx.utils.json_to_sheet(mapped);
      xlsx.utils.book_append_sheet(wb, ws, "Records");

      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `manage-data-${dateStr}.${query.format}`;

      if (query.format === "csv") {
        const csvStr = xlsx.write(wb, { type: "buffer", bookType: "csv" });
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.send(csvStr);
      } else {
        const excelBuffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.send(excelBuffer);
      }

      await AuditLogService.logAction({
        action: "EXPORT",
        entityId: "bulk-export",
        details: { format: query.format, count: mapped.length, filters: query }
      });
      
    } catch (error: any) {
      if (error.name === "ZodError") {
        res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid query parameters",
            details: error.errors,
          },
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
