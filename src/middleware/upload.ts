import multer from 'multer';
import path from 'path';
import { Request } from 'express';

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_EXTENSIONS = ['.xlsx', '.xls', '.csv'];

/**
 * Multer upload middleware.
 * - Memory storage (no temp files on disk)
 * - 5 MB file size limit
 * - Only .xlsx, .xls, .csv extensions accepted
 */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_BYTES,
  },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXTENSIONS.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type "${ext}". Upload an .xlsx, .xls or .csv file.`));
    }
  },
});
