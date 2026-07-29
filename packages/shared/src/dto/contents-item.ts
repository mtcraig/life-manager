import { z } from 'zod';

export interface ContentsItemDto {
  id: number;
  name: string;
  areaId: number;
  value: number;
  purchaseDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export const createContentsItemSchema = z.object({
  name: z.string().min(1),
  areaId: z.number().int().positive(),
  value: z.number().int(),
  purchaseDate: z.string().optional(),
  notes: z.string().min(1).optional(),
});
export type CreateContentsItemInput = z.infer<typeof createContentsItemSchema>;

export const updateContentsItemSchema = createContentsItemSchema.partial();
export type UpdateContentsItemInput = z.infer<typeof updateContentsItemSchema>;
