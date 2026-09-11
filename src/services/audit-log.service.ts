import { AuditLogModel, type IAuditLog, type AuditAction } from "../models/audit-log.model";

export class AuditLogService {
  static async logAction(data: {
    action: AuditAction;
    entityType?: string;
    entityId: string;
    details?: any;
    actor?: { id: string; name: string; email: string };
  }): Promise<IAuditLog> {
    const log = new AuditLogModel({
      action: data.action,
      entityType: data.entityType || "Record",
      entityId: data.entityId,
      details: data.details,
      actorId: data.actor?.id,
      actorName: data.actor?.name,
      actorEmail: data.actor?.email,
    });
    return log.save();
  }

  static async getLogs(
    page: number = 1,
    pageSize: number = 10
  ): Promise<{ items: IAuditLog[]; total: number; page: number; pageSize: number; totalPages: number }> {
    const skip = (page - 1) * pageSize;
    
    const [items, total] = await Promise.all([
      AuditLogModel.find().sort({ createdAt: -1 }).skip(skip).limit(pageSize),
      AuditLogModel.countDocuments()
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
