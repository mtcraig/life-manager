import { z } from 'zod';

export interface CategoryDto {
  id: number;
  name: string;
  isTransfer: boolean;
  kind: string | null;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

export const createCategorySchema = z.object({
  name: z.string().min(1),
  isTransfer: z.boolean().default(false),
  kind: z.string().min(1).optional(),
  color: z.string().min(1).optional(),
});
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
