import * as XLSX from 'xlsx';
import { RecordModel, RECORD_TYPES } from '../models/record.model';
import { importRowSchema, type ImportRowInput } from '../validators/import.validator';

// ── Canonical field definitions (mirrored from frontend types/record.ts) ──

type CanonicalKey = 'name' | 'email' | 'phone' | 'address' | 'organisation' | 'type';

interface CanonicalField {
  key: CanonicalKey;
  label: string;
  required: boolean;
}

const CANONICAL_FIELDS: CanonicalField[] = [
  { key: 'name', label: 'Name', required: true },
  { key: 'email', label: 'Email', required: true },
  { key: 'phone', label: 'Phone', required: true },
  { key: 'address', label: 'Address', required: false },
  { key: 'organisation', label: 'Organisation', required: false },
  { key: 'type', label: 'Type', required: false },
];

type HeaderMapping = Partial<Record<CanonicalKey, string>>;

// ── Header synonym table (same as frontend import-service.ts) ──

const normalise = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

const SYNONYMS: Record<CanonicalKey, string[]> = {
  name: ['name', 'fullname', 'studentname', 'contactname', 'person'],
  email: ['email', 'emailaddress', 'mail', 'emailid'],
  phone: ['phone', 'phonenumber', 'mobile', 'mobileno', 'contact', 'contactnumber'],
  address: ['address', 'location', 'city', 'fulladdress'],
  organisation: ['organisation', 'organization', 'company', 'institute', 'school', 'college'],
  type: ['type', 'category', 'role', 'usertype'],
};

function suggestMapping(headers: string[]): HeaderMapping {
  const mapping: HeaderMapping = {};
  for (const field of CANONICAL_FIELDS) {
    const match = headers.find((h) => SYNONYMS[field.key].includes(normalise(h)));
    if (match) mapping[field.key] = match;
  }
  return mapping;
}

// ── Type coercion (same logic as frontend import-service.ts) ──

function coerceType(value: string): (typeof RECORD_TYPES)[number] {
  const v = normalise(value);
  const found = RECORD_TYPES.find((t) => normalise(t) === v);
  if (found) return found;
  if (v.includes('student')) return 'Student';
  if (v.includes('teacher')) return 'Teacher';
  if (v.includes('mentor')) return 'Mentor';
  if (v.includes('job')) return 'Job Seeker';
  if (v.includes('institute') || v.includes('school')) return 'Institute';
  return 'Other';
}

// ── Row error interface ──

export interface RowError {
  rowNumber: number;
  field: string;
  message: string;
}

export interface PreviewResult {
  fileName: string;
  headers: string[];
  suggestedMapping: HeaderMapping;
  validRows: ImportRowInput[];
  errors: RowError[];
  totalRows: number;
}

export interface ImportResult {
  inserted: number;
}

// ── Service class ──

export class ImportService {
  /**
   * Parse an uploaded spreadsheet buffer and return a preview.
   */
  static parseAndPreview(buffer: Buffer, originalName: string): PreviewResult {
    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(buffer, { type: 'buffer' });
    } catch {
      throw new Error('This file could not be read. It may be corrupted.');
    }

    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error('The file has no worksheets.');
    }

    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      throw new Error('The file has no worksheets.');
    }

    const matrix = XLSX.utils.sheet_to_json<string[]>(sheet, {
      header: 1,
      blankrows: false,
      defval: '',
      raw: false,
    });

    if (matrix.length < 2) {
      throw new Error('The file needs a header row and at least one data row.');
    }

    const headers = (matrix[0] ?? [])
      .map((h) => String(h ?? '').trim())
      .filter((h) => h.length > 0);

    if (headers.length === 0) {
      throw new Error('No column headers were found.');
    }

    const rawRows = matrix.slice(1).map((row) => {
      const record: Record<string, string> = {};
      headers.forEach((header, i) => {
        record[header] = String(row[i] ?? '').trim();
      });
      return record;
    });

    const mapping = suggestMapping(headers);
    const { validRows, errors } = ImportService.validateRows(rawRows, mapping);

    return {
      fileName: originalName,
      headers,
      suggestedMapping: mapping,
      validRows,
      errors,
      totalRows: rawRows.length,
    };
  }

  /**
   * Validate raw rows using a header mapping.
   */
  static validateRows(
    rawRows: Record<string, string>[],
    mapping: HeaderMapping
  ): { validRows: ImportRowInput[]; errors: RowError[] } {
    const validRows: ImportRowInput[] = [];
    const errors: RowError[] = [];
    const seenEmails = new Set<string>();

    rawRows.forEach((row, index) => {
      const rowNumber = index + 2; // +1 header, +1 one-based

      const candidate = {
        name: mapping.name ? (row[mapping.name] ?? '') : '',
        email: mapping.email ? (row[mapping.email] ?? '') : '',
        phone: mapping.phone ? (row[mapping.phone] ?? '') : '',
        address: mapping.address ? (row[mapping.address] ?? '') : '',
        organisation: mapping.organisation ? (row[mapping.organisation] ?? '') : '',
        type: coerceType(mapping.type ? (row[mapping.type] ?? '') : ''),
        linkStatus: 'Pending' as const,
        downloadStatus: 'Not Downloaded' as const,
      };

      const result = importRowSchema.safeParse(candidate);
      if (!result.success) {
        for (const issue of result.error.issues) {
          errors.push({
            rowNumber,
            field: String(issue.path[0] ?? 'row'),
            message: issue.message,
          });
        }
        return;
      }

      const emailKey = result.data.email.toLowerCase();
      if (seenEmails.has(emailKey)) {
        errors.push({
          rowNumber,
          field: 'email',
          message: `Duplicate email in this file (${result.data.email})`,
        });
        return;
      }
      seenEmails.add(emailKey);
      validRows.push(result.data);
    });

    return { validRows, errors };
  }

  /**
   * Persist validated rows to MongoDB.
   * Re-validates every row server-side before insertion.
   */
  static async persistRows(rows: ImportRowInput[]): Promise<ImportResult> {
    if (rows.length === 0) {
      throw new Error('There are no valid rows to import');
    }

    const now = new Date();

    const documents = rows.map((row) => ({
      name: row.name,
      email: row.email,
      phoneNumber: row.phone, // frontend uses 'phone', model uses 'phoneNumber'
      address: row.address,
      organisation: row.organisation,
      type: row.type,
      linkStatus: row.linkStatus,
      downloadStatus: row.downloadStatus,
      dateAdded: now,
    }));

    const result = await RecordModel.insertMany(documents);
    return { inserted: result.length };
  }
}
