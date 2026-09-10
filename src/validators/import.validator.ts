import { z } from 'zod';
import { RECORD_TYPES, LINK_STATUSES, DOWNLOAD_STATUSES } from '../models/record.model';

/**
 * Zod schema for validating a single import row.
 * Matches the frontend's RecordInput contract exactly:
 *   { name, email, phone, address, organisation, type, linkStatus, downloadStatus }
 */
export const importRowSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters'),
  email: z
    .string()
    .trim()
    .email('Enter a valid email address'),
  phone: z
    .string()
    .trim()
    .min(7, 'Phone must be at least 7 digits')
    .regex(/^[0-9+\-()\s]+$/, 'Phone may only contain digits and + - ( )'),
  address: z
    .string()
    .trim()
    .max(500, 'Address is too long')
    .default(''),
  organisation: z
    .string()
    .trim()
    .max(255, 'Organisation is too long')
    .default(''),
  type: z.enum(RECORD_TYPES).default('Other'),
  linkStatus: z.enum(LINK_STATUSES).default('Pending'),
  downloadStatus: z.enum(DOWNLOAD_STATUSES).default('Pending'),
});

export type ImportRowInput = z.infer<typeof importRowSchema>;

/**
 * Schema for validating the entire import commit body (array of rows).
 */
export const importCommitSchema = z.array(importRowSchema).min(1, 'At least one valid row is required');
