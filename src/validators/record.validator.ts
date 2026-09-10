import { z } from 'zod';
import { RECORD_TYPES, LINK_STATUSES, DOWNLOAD_STATUSES } from '../models/record.model';

export const createRecordSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(255, 'Name is too long'),
  email: z.string().trim().email('Enter a valid email address').max(255).optional().or(z.literal('')),
  phoneNumber: z.string().trim().min(7, 'Phone must be at least 7 digits').max(50).regex(/^[0-9+\-()\s]+$/, 'Phone may only contain digits and + - ( )').optional().or(z.literal('')),
  address: z.string().trim().max(500, 'Address is too long').optional().or(z.literal('')),
  organisation: z.string().trim().max(255, 'Organisation is too long').optional().or(z.literal('')),
  type: z.enum(RECORD_TYPES).default('Other'),
  linkStatus: z.enum(LINK_STATUSES).default('Pending'),
  downloadStatus: z.enum(DOWNLOAD_STATUSES).default('Pending'),
  dateAdded: z.string().datetime().or(z.date()).optional(),
});

// For PATCH /api/records/:id - explicitly omit internal fields, make all others optional
export const updateRecordSchema = createRecordSchema
  .omit({ dateAdded: true })
  .partial();

// For GET /api/records query parameters
export const queryRecordsSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default(1),
  pageSize: z.string().regex(/^\d+$/).transform(Number).default(25),
  category: z.string().optional(),
  search: z.string().trim().optional(),
  linkStatus: z.string().optional(),
  downloadStatus: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  sortBy: z.enum([
    'name', 'email', 'phoneNumber', 'address',
    'organisation', 'type', 'linkStatus',
    'downloadStatus', 'dateAdded',
  ]).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type CreateRecordInput = z.infer<typeof createRecordSchema>;
export type UpdateRecordInput = z.infer<typeof updateRecordSchema>;
export type QueryRecordsInput = z.infer<typeof queryRecordsSchema>;

// For DELETE /api/records/bulk
export const bulkDeleteSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "At least one ID is required"),
});

// For PATCH /api/records/bulk
export const bulkUpdateSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "At least one ID is required"),
  updates: z.object({
    type: z.enum(RECORD_TYPES).optional(),
    linkStatus: z.enum(LINK_STATUSES).optional(),
    downloadStatus: z.enum(DOWNLOAD_STATUSES).optional(),
  }).strict().refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be updated",
  }),
});

export type BulkDeleteInput = z.infer<typeof bulkDeleteSchema>;
export type BulkUpdateInput = z.infer<typeof bulkUpdateSchema>;

