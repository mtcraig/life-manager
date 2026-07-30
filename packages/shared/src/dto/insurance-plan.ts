import { z } from 'zod';
import { PREMIUM_FREQUENCIES } from '../enums.js';

/** Informational only — insurance plans carry no FK linkage to any Wealth table. */
export interface InsurancePlanDto {
  id: number;
  name: string;
  type: string;
  coverageAmount: number;
  premiumAmount: number;
  premiumFrequency: (typeof PREMIUM_FREQUENCIES)[number];
  effectiveDate: string;
  renewalDate: string;
  provider: string | null;
  notes: string | null;
  /** Set automatically once past renewalDate (on next read), or manually via the cancel action. */
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const createInsurancePlanSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  coverageAmount: z.number().int(),
  premiumAmount: z.number().int(),
  premiumFrequency: z.enum(PREMIUM_FREQUENCIES),
  effectiveDate: z.string(),
  renewalDate: z.string(),
  provider: z.string().min(1).optional(),
  notes: z.string().min(1).optional(),
});
export type CreateInsurancePlanInput = z.infer<typeof createInsurancePlanSchema>;

export const updateInsurancePlanSchema = createInsurancePlanSchema.partial();
export type UpdateInsurancePlanInput = z.infer<typeof updateInsurancePlanSchema>;
