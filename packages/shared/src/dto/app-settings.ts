import { z } from 'zod';

export const TOP_TRANSACTIONS_DISPLAYS = ['description', 'category_vendor'] as const;
export type TopTransactionsDisplay = (typeof TOP_TRANSACTIONS_DISPLAYS)[number];

/** Display-only date part order (unrelated to account.ts's DATE_FORMATS, which parses CSV import date strings). */
export const DISPLAY_DATE_FORMATS = ['dd_mm', 'mm_dd'] as const;
export type DisplayDateFormat = (typeof DISPLAY_DATE_FORMATS)[number];

export interface AppSettingsDto {
  userName: string | null;
  /** Never null on the wire - the service resolves a missing preference to the app-level default ('description'). */
  topTransactionsDisplay: TopTransactionsDisplay;
  /** Never null on the wire - the service resolves a missing preference to the app-level default ('dd_mm'). */
  dateFormat: DisplayDateFormat;
}

export const updateAppSettingsSchema = z.object({
  userName: z.string().trim().min(1).nullable().optional(),
  topTransactionsDisplay: z.enum(TOP_TRANSACTIONS_DISPLAYS).optional(),
  dateFormat: z.enum(DISPLAY_DATE_FORMATS).optional(),
});
export type UpdateAppSettingsInput = z.infer<typeof updateAppSettingsSchema>;
