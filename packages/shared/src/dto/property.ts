import { z } from 'zod';

export interface PropertyDto {
  id: number;
  name: string;
  address: string | null;
  notes: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  currentValue: number | null; // latest recorded valuation, null if none yet
}

export const createPropertySchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1).optional(),
  notes: z.string().min(1).optional(),
});
export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
