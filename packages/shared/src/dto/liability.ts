import { z } from 'zod';

export interface LiabilityDto {
  id: number;
  name: string;
  kind: string | null;
  notes: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  currentValue: number | null; // latest recorded valuation (amount owed), null if none yet
}

export const createLiabilitySchema = z.object({
  name: z.string().min(1),
  kind: z.string().min(1).optional(),
  notes: z.string().min(1).optional(),
});
export type CreateLiabilityInput = z.infer<typeof createLiabilitySchema>;
