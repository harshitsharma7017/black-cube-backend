import { ImportHistoryModel, type IImportHistory, type ImportStatus } from "../models/import-history.model";

export class ImportHistoryService {
  static async logImport(data: {
    fileName: string;
    totalRows: number;
    importedRows: number;
    failedRows: number;
    status: ImportStatus;
  }): Promise<IImportHistory> {
    const history = new ImportHistoryModel(data);
    return history.save();
  }

  static async getHistory(
    page: number = 1,
    pageSize: number = 10
  ): Promise<{ items: IImportHistory[]; total: number; page: number; pageSize: number; totalPages: number }> {
    const skip = (page - 1) * pageSize;
    
    const [items, total] = await Promise.all([
      ImportHistoryModel.find().sort({ createdAt: -1 }).skip(skip).limit(pageSize),
      ImportHistoryModel.countDocuments()
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }
}
