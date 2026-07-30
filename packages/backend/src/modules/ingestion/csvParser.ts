import { parse } from 'csv-parse/sync';
import type { AccountType, ColumnMapping } from '@life-manager/shared';
import { parseDateToIso } from '../../lib/date';
import { parseMoneyToMinorUnits } from '../../lib/money';
import { normalizeDescription } from '../../lib/normalize';

export interface ParsedTransactionRow {
  date: string;
  amount: number;
  description: string;
  normalizedDescription: string;
  externalId: string | null;
  balanceAfter: number | null;
  rawCsvRow: Record<string, string>;
}

/**
 * Parses raw CSV file content into canonical transaction rows using an
 * account's configured column mapping. Each account's CSV export format
 * varies by institution, so the mapping (not this parser) carries that variance.
 *
 * `accountType` is optional so existing callers/tests that don't care about
 * sign convention keep working. When it's `'credit_card'`, the computed
 * amount is negated: card statements report spending as positive and
 * payments as negative, the opposite of every other account type's "money
 * out = negative" convention used throughout the rest of the app.
 */
export function parseAccountCsv(
  csvContent: string,
  mapping: ColumnMapping,
  accountType?: AccountType,
): ParsedTransactionRow[] {
  const records: Record<string, string>[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  return records.map((row) => {
    const rawDate = requireColumn(row, mapping.date, 'date');
    const description = requireColumn(row, mapping.description, 'description');

    const rawAmount = mapping.amount
      ? parseMoneyToMinorUnits(requireColumn(row, mapping.amount, 'amount'))
      : parseMoneyOrZero(requireColumn(row, mapping.credit as string, 'credit')) -
        parseMoneyOrZero(requireColumn(row, mapping.debit as string, 'debit'));
    const amount = accountType === 'credit_card' ? -rawAmount : rawAmount;

    return {
      date: parseDateToIso(rawDate, mapping.dateFormat),
      amount,
      description,
      normalizedDescription: normalizeDescription(description),
      externalId: mapping.externalId ? (row[mapping.externalId] ?? null) : null,
      balanceAfter: mapping.balance ? parseOptionalBalance(row, mapping.balance) : null,
      rawCsvRow: row,
    };
  });
}

function requireColumn(row: Record<string, string>, column: string, label: string): string {
  const value = row[column];
  if (value === undefined) {
    throw new Error(`Missing expected "${label}" column ("${column}") in CSV row: ${JSON.stringify(row)}`);
  }
  return value;
}

/**
 * Separate debit/credit columns are normally populated on only one side per
 * row — a blank cell means "no amount on this side", i.e. 0, not a parse
 * failure. A present-but-garbled value still throws (same strictness as a
 * garbled single amount column).
 */
function parseMoneyOrZero(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === '') return 0;
  return parseMoneyToMinorUnits(raw);
}

/**
 * Balance is supplementary, not essential like date/description/amount — a
 * missing column or blank cell yields null rather than failing the row, but a
 * present-and-garbled value still throws (same strictness as a garbled amount).
 */
function parseOptionalBalance(row: Record<string, string>, column: string): number | null {
  const raw = row[column];
  if (raw === undefined || raw.trim() === '') return null;
  return parseMoneyToMinorUnits(raw);
}
