import { Schema, model, Document } from "mongoose";

export const AUDIT_ACTIONS = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "BULK_UPDATE",
  "BULK_DELETE",
  "IMPORT",
  "EXPORT",
  "SIGN_UP",
  "SIGN_IN",
  "SIGN_OUT"
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export interface IAuditLog extends Document {
  action: AuditAction;
  entityType: string;
  entityId: string;
  details: any;
  actorId?: string;
  actorName?: string;
  actorEmail?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: { type: String, enum: AUDIT_ACTIONS, required: true },
    entityType: { type: String, required: true, default: "Record" },
    entityId: { type: String, required: true },
    details: { type: Schema.Types.Mixed },
    actorId: { type: String },
    actorName: { type: String },
    actorEmail: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ entityId: 1 });

export const AuditLogModel = model<IAuditLog>("AuditLog", AuditLogSchema);
