import { z } from 'zod';

export interface InvestmentDto {
  id: number;
  name: string;
  kind: string | null;
  notes: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  currentValue: number | null; // latest recorded valuation, null if none yet
}

export const createInvestmentSchema = z.object({
  name: z.string().min(1),
  kind: z.string().min(1).optional(),
  notes: z.string().min(1).optional(),
});
export type CreateInvestmentInput = z.infer<typeof createInvestmentSchema>;

/** One (investment, month) point in the holdings-over-time stacked bar chart — see groupHoldingsByMonth. */
export interface HoldingsMonthRowDto {
  month: string; // YYYY-MM
  investmentId: number;
  investmentName: string;
  value: number; // integer pence, forward-filled from the most recent valuation at or before this month
}
