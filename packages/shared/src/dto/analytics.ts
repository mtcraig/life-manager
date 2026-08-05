import { z } from 'zod';

export interface MoneyFlowDayDto {
  date: string; // ISO YYYY-MM-DD
  moneyIn: number; // integer pence
  moneyOut: number; // integer pence, <= 0
  net: number; // integer pence
}

export interface MoneyFlowResultDto {
  days: MoneyFlowDayDto[];
  totals: {
    moneyIn: number;
    moneyOut: number;
    net: number;
  };
}

export const moneyFlowQuerySchema = z.object({
  accountId: z.coerce.number().int().positive().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});
export type MoneyFlowQuery = z.infer<typeof moneyFlowQuerySchema>;

export interface BalanceTrendPointDto {
  date: string; // ISO YYYY-MM-DD
  balance: number; // integer pence — bank-reported where confirmed, otherwise a computed running total
  confirmed: boolean; // true once a bank-reported balance has been seen on or before this date
}

export const accountBalanceTrendQuerySchema = z.object({
  accountId: z.coerce.number().int().positive(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});
export type AccountBalanceTrendQuery = z.infer<typeof accountBalanceTrendQuerySchema>;

export interface CategorySummaryRowDto {
  categoryId: number | null;
  categoryName: string;
  total: number; // integer pence, positive (spending magnitude)
}

export const categorySummaryQuerySchema = z.object({
  accountId: z.coerce.number().int().positive().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});
export type CategorySummaryQuery = z.infer<typeof categorySummaryQuerySchema>;

export interface CategoryMonthSummaryRowDto {
  month: string; // YYYY-MM
  categoryId: number | null;
  categoryName: string;
  total: number; // integer pence, positive (spending magnitude)
}

export interface TopTransactionDto {
  id: number;
  date: string; // ISO YYYY-MM-DD
  description: string;
  amount: number; // integer pence
  categoryName: string | null;
  vendorName: string | null;
}

export interface TopTransactionsResultDto {
  topIncome: TopTransactionDto[];
  topExpenses: TopTransactionDto[];
}

export const topTransactionsQuerySchema = z.object({
  accountId: z.coerce.number().int().positive().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  limit: z.coerce.number().int().positive().max(50).default(5),
});
export type TopTransactionsQuery = z.infer<typeof topTransactionsQuerySchema>;

export const transactionDateBoundsQuerySchema = z.object({
  accountId: z.coerce.number().int().positive().optional(),
});
export type TransactionDateBoundsQuery = z.infer<typeof transactionDateBoundsQuerySchema>;

/** Drives year-filter controls so they only offer years with real data, instead of a fixed window. */
export interface TransactionDateBoundsDto {
  earliestDate: string | null; // ISO YYYY-MM-DD, null when there are no transactions yet
}
