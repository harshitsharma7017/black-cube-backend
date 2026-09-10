import { Request, Response, NextFunction } from 'express';
import { ImportService } from '../services/import.service';
import { importCommitSchema } from '../validators/import.validator';

export class ImportController {
  /**
   * POST /api/import/preview
   * Accepts multipart file upload, parses spreadsheet, validates rows,
   * and returns a preview with suggested header mapping.
   */
  static async preview(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        res.status(400).json({
          error: {
            code: 'MISSING_FILE',
            message: 'No file was uploaded. Please upload an .xlsx, .xls or .csv file.',
          },
        });
        return;
      }

      const result = ImportService.parseAndPreview(req.file.buffer, req.file.originalname);

      res.json({
        data: {
          fileName: result.fileName,
          headers: result.headers,
          suggestedMapping: result.suggestedMapping,
          validRows: result.validRows,
          errors: result.errors,
          totalRows: result.totalRows,
        },
        error: null,
        meta: null,
      });
    } catch (error) {
      if (error instanceof Error) {
        // File parsing/validation errors are client errors (422)
        res.status(422).json({
          error: {
            code: 'FILE_PROCESSING_ERROR',
            message: error.message,
          },
        });
        return;
      }
      next(error);
    }
  }

  /**
   * POST /api/import
   * Accepts a JSON body of RecordInput[] rows (matching the frontend contract),
   * re-validates every row server-side, and bulk-inserts into MongoDB.
   */
  static async commitImport(req: Request, res: Response, next: NextFunction) {
    try {
      // Re-validate every row server-side — never trust the client
      const parseResult = importCommitSchema.safeParse(req.body);

      if (!parseResult.success) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid import data. Please correct the highlighted fields.',
            details: parseResult.error.issues.map((issue) => ({
              rowIndex: issue.path[0],
              field: String(issue.path[1] ?? 'row'),
              message: issue.message,
            })),
          },
        });
        return;
      }

      const validRows = parseResult.data;

      if (validRows.length === 0) {
        res.status(422).json({
          error: {
            code: 'NO_VALID_ROWS',
            message: 'There are no valid rows to import.',
          },
        });
        return;
      }

      const result = await ImportService.persistRows(validRows);

      res.status(201).json({
        data: { inserted: result.inserted },
        error: null,
        meta: null,
      });
    } catch (error) {
      next(error);
    }
  }
}
