import { parse } from 'csv-parse/sync';
import type { ColumnMapping } from '@life-manager/shared';
import { parseDateToIso } from '../../lib/date';
import { parseMoneyToMinorUnits } from '../../lib/money';
import { normalizeDescription } from '../../lib/normalize';

export interface ParsedTransactionRow {
  date: string;
  amount: number;
  description: string;
  normalizedDescription: string;
  externalId: string | null;
  rawCsvRow: Record<string, string>;
}

/**
 * Parses raw CSV file content into canonical transaction rows using an
 * account's configured column mapping. Each account's CSV export format
 * varies by institution, so the mapping (not this parser) carries that variance.
 */
export function parseAccountCsv(csvContent: string, mapping: ColumnMapping): ParsedTransactionRow[] {
  const records: Record<string, string>[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  return records.map((row) => {
    const rawDate = requireColumn(row, mapping.date, 'date');
    const description = requireColumn(row, mapping.description, 'description');

    const amount = mapping.amount
      ? parseMoneyToMinorUnits(requireColumn(row, mapping.amount, 'amount'))
      : parseMoneyToMinorUnits(requireColumn(row, mapping.credit as string, 'credit')) -
        parseMoneyToMinorUnits(requireColumn(row, mapping.debit as string, 'debit'));

    return {
      date: parseDateToIso(rawDate, mapping.dateFormat),
      amount,
      description,
      normalizedDescription: normalizeDescription(description),
      externalId: mapping.externalId ? (row[mapping.externalId] ?? null) : null,
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
