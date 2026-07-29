import { z } from 'zod';

export interface AreaDto {
  id: number;
  name: string;
  createdAt: string;
}

export const createAreaSchema = z.object({
  name: z.string().min(1),
});
export type CreateAreaInput = z.infer<typeof createAreaSchema>;
