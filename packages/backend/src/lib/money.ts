/**
 * Converts a raw CSV amount string into integer minor units (pence).
 * Handles common bank export formatting: currency symbols, thousands
 * separators, and parenthesised negatives (accounting notation), e.g. "(12.34)".
 */
export function parseMoneyToMinorUnits(raw: string): number {
  const trimmed = raw.trim();
  const isParenthesised = /^\(.*\)$/.test(trimmed);
  const cleaned = trimmed
    .replace(/^\(|\)$/g, '')
    .replace(/[£$€,]/g, '')
    .trim();

  const value = Number.parseFloat(cleaned);
  if (Number.isNaN(value)) {
    throw new Error(`Cannot parse amount: "${raw}"`);
  }

  const minorUnits = Math.round(value * 100);
  return isParenthesised ? -minorUnits : minorUnits;
}
