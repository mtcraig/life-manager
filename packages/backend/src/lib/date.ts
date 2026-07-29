import type { DateFormat } from '@life-manager/shared';

/**
 * Parses a raw CSV date string (in one of the account's configured formats)
 * into the app's canonical ISO `YYYY-MM-DD` representation.
 */
export function parseDateToIso(raw: string, format: DateFormat): string {
  const trimmed = raw.trim();

  if (format === 'YYYY-MM-DD') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      throw new Error(`Date "${raw}" does not match format YYYY-MM-DD`);
    }
    return trimmed;
  }

  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
  if (!match) {
    throw new Error(`Date "${raw}" does not match format ${format}`);
  }
  const [, first, second, year] = match as unknown as [string, string, string, string];

  const day = format === 'DD/MM/YYYY' ? first : second;
  const month = format === 'DD/MM/YYYY' ? second : first;

  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}
