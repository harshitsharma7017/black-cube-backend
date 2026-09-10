import mongoose from 'mongoose';
import { RecordModel, IRecord, RECORD_TYPES } from '../models/record.model';
import { QueryRecordsInput, UpdateRecordInput, ExportRecordsInput } from '../validators/record.validator';
import { AuditLogService } from './audit-log.service';

export class RecordService {
  /**
   * Bulk delete records by IDs
   */
  static async bulkDeleteRecords(ids: string[]) {
    const result = await RecordModel.deleteMany({ _id: { $in: ids } });
    if (result.deletedCount > 0) {
      await AuditLogService.logAction({
        action: "BULK_DELETE",
        entityId: "bulk",
        details: { affectedCount: result.deletedCount }
      });
    }
    return result;
  }

  /**
   * Bulk update records by IDs
   */
  static async bulkUpdateRecords(ids: string[], updates: Partial<UpdateRecordInput>) {
    const result = await RecordModel.updateMany({ _id: { $in: ids } }, { $set: updates }, { runValidators: true });
    if (result.modifiedCount > 0) {
      await AuditLogService.logAction({
        action: "BULK_UPDATE",
        entityId: "bulk",
        details: { affectedCount: result.modifiedCount, updates }
      });
    }
    return result;
  }
  /**
   * Fetch paginated and filtered records
   */
  static async getRecords(query: QueryRecordsInput) {
    const filter: Record<string, any> = {};

    // 1. Search (name, email, phone)
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
        { phoneNumber: { $regex: query.search, $options: 'i' } },
      ];
    }

    // 2. Category / Type filtering
    if (query.category) {
      const match = RECORD_TYPES.find((t) => t.toLowerCase() === query.category?.toLowerCase() || t === query.category);
      if (match) {
        filter.type = match;
      }
    }

    // 3. Status filtering
    if (query.linkStatus && query.linkStatus !== 'all') {
      filter.linkStatus = query.linkStatus;
    }
    if (query.downloadStatus && query.downloadStatus !== 'all') {
      filter.downloadStatus = query.downloadStatus;
    }

    // 4. Date filtering
    if (query.dateFrom || query.dateTo) {
      filter.dateAdded = {};
      if (query.dateFrom) filter.dateAdded.$gte = new Date(query.dateFrom);
      if (query.dateTo) filter.dateAdded.$lte = new Date(query.dateTo);
    }

    // Pagination
    const page = Math.max(1, query.page);
    const pageSize = Math.max(1, query.pageSize);
    const skip = (page - 1) * pageSize;

    // Build sort: user-specified field + stable secondary sort on _id
    const sortField = query.sortBy ?? 'dateAdded';
    const sortDir: 1 | -1 = query.sortOrder === 'asc' ? 1 : -1;
    const sort: Record<string, 1 | -1> = { [sortField]: sortDir, _id: sortDir };

    const [items, total] = await Promise.all([
      RecordModel.find(filter).sort(sort).skip(skip).limit(pageSize),
      RecordModel.countDocuments(filter),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Get single record by ID
   */
  
  /**
   * Fetch all matching records for export (ignores pagination)
   */
  static async getAllRecordsForExport(query: ExportRecordsInput) {
    const filter: Record<string, any> = {};

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: "i" } },
        { email: { $regex: query.search, $options: "i" } },
        { phoneNumber: { $regex: query.search, $options: "i" } },
      ];
    }

    if (query.category) {
      const match = RECORD_TYPES.find((t) => t.toLowerCase() === query.category?.toLowerCase() || t === query.category);
      if (match) {
        filter.type = match;
      }
    }

    if (query.linkStatus && query.linkStatus !== "all") {
      filter.linkStatus = query.linkStatus;
    }
    if (query.downloadStatus && query.downloadStatus !== "all") {
      filter.downloadStatus = query.downloadStatus;
    }

    if (query.dateFrom || query.dateTo) {
      filter.dateAdded = {};
      if (query.dateFrom) filter.dateAdded.$gte = new Date(query.dateFrom);
      if (query.dateTo) filter.dateAdded.$lte = new Date(query.dateTo);
    }

    const sortField = query.sortBy ?? "dateAdded";
    const sortDir: 1 | -1 = query.sortOrder === "asc" ? 1 : -1;
    const sort: Record<string, 1 | -1> = { [sortField]: sortDir, _id: sortDir };

    return RecordModel.find(filter).sort(sort).lean();
  }

  static async getRecordById(id: string) {
    return RecordModel.findById(id);
  }

  /**
   * Update record by ID
   */
  static async updateRecord(id: string, data: UpdateRecordInput) {
    const existing = await RecordModel.findById(id);
    if (!existing) return null;

    const changes: Record<string, { before: any; after: any }> = {};
    for (const [key, value] of Object.entries(data)) {
      if (String((existing as any)[key]) !== String(value)) {
        changes[key] = { before: (existing as any)[key], after: value };
      }
    }

    const updated = await RecordModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (updated && Object.keys(changes).length > 0) {
      await AuditLogService.logAction({
        action: "UPDATE",
        entityId: id,
        details: changes
      });
    }
    return updated;
  }

  /**
   * Delete record by ID
   */
  static async deleteRecord(id: string) {
    const deleted = await RecordModel.findByIdAndDelete(id);
    if (deleted) {
      await AuditLogService.logAction({
        action: "DELETE",
        entityId: id,
        details: { name: deleted.name, email: deleted.email }
      });
    }
    return deleted;
  }
}