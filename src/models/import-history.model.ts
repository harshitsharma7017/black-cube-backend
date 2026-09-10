import { Schema, model, Document } from "mongoose";

export const IMPORT_STATUSES = ["Completed", "Completed with Errors", "Failed"] as const;
export type ImportStatus = (typeof IMPORT_STATUSES)[number];

export interface IImportHistory extends Document {
  fileName: string;
  totalRows: number;
  importedRows: number;
  failedRows: number;
  status: ImportStatus;
  createdAt: Date;
  updatedAt: Date;
}

const ImportHistorySchema = new Schema<IImportHistory>(
  {
    fileName: { type: String, required: true },
    totalRows: { type: Number, required: true, min: 0 },
    importedRows: { type: Number, required: true, min: 0 },
    failedRows: { type: Number, required: true, min: 0 },
    status: { type: String, enum: IMPORT_STATUSES, required: true },
  },
  { timestamps: true }
);

ImportHistorySchema.index({ createdAt: -1 });
ImportHistorySchema.index({ status: 1 });

export const ImportHistoryModel = model<IImportHistory>("ImportHistory", ImportHistorySchema);
