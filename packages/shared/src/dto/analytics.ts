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
