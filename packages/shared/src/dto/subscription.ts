import { z } from 'zod';
import { SUBSCRIPTION_FREQUENCIES } from '../enums.js';

export interface SubscriptionDto {
  id: number;
  name: string;
  provider: string | null;
  amount: number;
  frequency: (typeof SUBSCRIPTION_FREQUENCIES)[number];
  categoryId: number | null;
  startDate: string;
  nextRenewalDate: string;
  /** Set only via the cancel action — a subscription never auto-expires the way an insurance plan does. */
  cancelledAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export const createSubscriptionSchema = z.object({
  name: z.string().min(1),
  provider: z.string().min(1).optional(),
  amount: z.number().int(),
  frequency: z.enum(SUBSCRIPTION_FREQUENCIES),
  categoryId: z.number().int().positive().optional(),
  startDate: z.string(),
  nextRenewalDate: z.string(),
  notes: z.string().min(1).optional(),
});
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;

export const updateSubscriptionSchema = createSubscriptionSchema.partial();
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
