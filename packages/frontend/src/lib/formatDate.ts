import type { DisplayDateFormat } from '@life-manager/shared';
import { useAppSettings } from '../hooks/useAppSettings.js';

/** Matches the backend default (dd_mm) while settings are still loading, so nothing flashes between formats. */
const FALLBACK_FORMAT: DisplayDateFormat = 'dd_mm';

export function useDateFormat(): DisplayDateFormat {
  const { data: appSettings } = useAppSettings();
  return appSettings?.dateFormat ?? FALLBACK_FORMAT;
}

/** Parses a 'YYYY-MM-DD' string and renders it as 'DD/MM/YYYY' or 'MM/DD/YYYY' - or, with `short: true`, just 'DD/MM'/'MM/DD' with no year. */
export function formatDisplayDate(iso: string, format: DisplayDateFormat, options?: { short?: boolean }): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  const [, year, month, day] = match as unknown as [string, string, string, string];

  const parts = format === 'dd_mm' ? [day, month] : [month, day];
  if (options?.short) return parts.join('/');
  return [...parts, year].join('/');
}
