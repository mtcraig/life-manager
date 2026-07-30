import { z } from 'zod';

export interface AppSettingsDto {
  userName: string | null;
}

export const updateAppSettingsSchema = z.object({
  userName: z.string().trim().min(1).nullable(),
});
export type UpdateAppSettingsInput = z.infer<typeof updateAppSettingsSchema>;
