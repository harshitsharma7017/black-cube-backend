import mongoose from 'mongoose';
import { RecordModel, IRecord, RECORD_TYPES } from '../models/record.model';
import { QueryRecordsInput, UpdateRecordInput } from '../validators/record.validator';

export class RecordService {
  /**
   * Bulk delete records by IDs
   */
  static async bulkDeleteRecords(ids: string[]) {
    return RecordModel.deleteMany({ _id: { $in: ids } });
  }

  /**
   * Bulk update records by IDs
   */
  static async bulkUpdateRecords(ids: string[], updates: Partial<UpdateRecordInput>) {
    return RecordModel.updateMany({ _id: { $in: ids } }, { $set: updates }, { runValidators: true });
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
  static async getRecordById(id: string) {
    return RecordModel.findById(id);
  }

  /**
   * Update record by ID
   */
  static async updateRecord(id: string, data: UpdateRecordInput) {
    return RecordModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }

  /**
   * Delete record by ID
   */
  static async deleteRecord(id: string) {
    return RecordModel.findByIdAndDelete(id);
  }
}