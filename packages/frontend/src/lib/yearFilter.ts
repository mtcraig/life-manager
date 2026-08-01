export type YearFilterValue = number | 'all';

const FALLBACK_WINDOW = 4;

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** dateTo caps at today for the current year rather than Dec 31, matching the rest of the app's YTD convention. */
export function dateRangeForYear(selectedYear: YearFilterValue): { dateFrom?: string; dateTo?: string } {
  if (selectedYear === 'all') return {};
  const currentYear = new Date().getFullYear();
  const dateTo = selectedYear === currentYear ? toIsoDate(new Date()) : `${selectedYear}-12-31`;
  return { dateFrom: `${selectedYear}-01-01`, dateTo };
}

/**
 * Selectable years, newest first, from the current year back to the earliest year with real
 * data — not a fixed window. While `earliestYear` hasn't loaded yet, falls back to a
 * short recent window so the control isn't empty on first paint.
 */
export function yearOptionsFrom(earliestYear: number | undefined): number[] {
  const currentYear = new Date().getFullYear();
  const startYear = earliestYear ?? currentYear - FALLBACK_WINDOW + 1;
  const length = Math.max(1, currentYear - startYear + 1);
  return Array.from({ length }, (_, i) => currentYear - i);
}
