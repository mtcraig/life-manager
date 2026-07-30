import { z } from 'zod';

export interface VendorDto {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export const createVendorSchema = z.object({
  name: z.string().min(1),
});
export type CreateVendorInput = z.infer<typeof createVendorSchema>;
