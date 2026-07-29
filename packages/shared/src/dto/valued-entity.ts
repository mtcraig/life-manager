import { z } from 'zod';

/**
 * Investments, properties, and liabilities all follow the same header +
 * dated-valuation-history pattern (to support trend charts, not just a single
 * current value) — this valuation shape is shared verbatim across all three,
 * with `entityId` normalised to a single field name regardless of the
 * underlying FK column (investment_id / property_id / liability_id) so the
 * frontend can use one valuation-history component for all three domains.
 */
export interface ValuationDto {
  id: number;
  entityId: number;
  asOfDate: string; // ISO YYYY-MM-DD
  value: number; // integer pence
  notes: string | null;
  createdAt: string;
}

export const createValuationSchema = z.object({
  asOfDate: z.string(),
  value: z.number().int(),
  notes: z.string().min(1).optional(),
});
export type CreateValuationInput = z.infer<typeof createValuationSchema>;
