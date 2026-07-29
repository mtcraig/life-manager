import { z } from 'zod';
import { ACCOUNT_TYPES, INGESTION_MODES } from '../enums.js';

export const DATE_FORMATS = ['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY'] as const;
export type DateFormat = (typeof DATE_FORMATS)[number];

/**
 * Maps an account's CSV column headers to the fields the ingestion pipeline
 * understands. Configured per-account (via Settings) since bank export formats vary.
 * Either `amount` (a single signed column) or both `debit` and `credit` (separate
 * unsigned columns) must be provided.
 */
export const columnMappingSchema = z
  .object({
    date: z.string().min(1),
    description: z.string().min(1),
    amount: z.string().min(1).optional(),
    debit: z.string().min(1).optional(),
    credit: z.string().min(1).optional(),
    externalId: z.string().min(1).optional(),
    dateFormat: z.enum(DATE_FORMATS).default('YYYY-MM-DD'),
  })
  .refine((mapping) => Boolean(mapping.amount) || Boolean(mapping.debit && mapping.credit), {
    message: 'Provide either an "amount" column, or both "debit" and "credit" columns.',
  });

export type ColumnMapping = z.infer<typeof columnMappingSchema>;

export interface AccountDto {
  id: number;
  name: string;
  type: (typeof ACCOUNT_TYPES)[number];
  institution: string | null;
  ingestionMode: (typeof INGESTION_MODES)[number];
  folderPath: string | null;
  columnMapping: ColumnMapping | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const createAccountSchema = z.object({
  name: z.string().min(1),
  type: z.enum(ACCOUNT_TYPES),
  institution: z.string().min(1).optional(),
  ingestionMode: z.enum(INGESTION_MODES).default('manual'),
  folderPath: z.string().min(1).optional(),
  columnMapping: columnMappingSchema.optional(),
});
export type CreateAccountInput = z.infer<typeof createAccountSchema>;

export const updateAccountSchema = createAccountSchema.partial();
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
