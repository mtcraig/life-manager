import { z } from 'zod';
import { CATEGORY_SOURCES } from '../enums.js';

export interface TransactionDto {
  id: number;
  accountId: number;
  date: string; // ISO YYYY-MM-DD
  amount: number; // integer pence; positive = money in, negative = money out
  description: string;
  normalizedDescription: string;
  categoryId: number | null; // null = Uncategorised
  categorySource: (typeof CATEGORY_SOURCES)[number] | null;
  matchedRuleId: number | null;
  vendorId: number | null;
  vendorSource: (typeof CATEGORY_SOURCES)[number] | null;
  balanceAfter: number | null; // bank-reported balance after this transaction, when known
  importedAt: string;
}

export const transactionListQuerySchema = z.object({
  accountId: z.coerce.number().int().positive().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  uncategorisedOnly: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(100),
});
export type TransactionListQuery = z.infer<typeof transactionListQuerySchema>;

export interface TransactionListResultDto {
  items: TransactionDto[];
  total: number;
  page: number;
  pageSize: number;
}

export const updateTransactionCategorySchema = z.object({
  categoryId: z.number().int().positive().nullable(),
});
export type UpdateTransactionCategoryInput = z.infer<typeof updateTransactionCategorySchema>;
