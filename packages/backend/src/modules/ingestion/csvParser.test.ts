import { describe, expect, it } from 'vitest';
import type { ColumnMapping } from '@life-manager/shared';
import { parseAccountCsv } from './csvParser';

const baseMapping: ColumnMapping = {
  date: 'Date',
  description: 'Description',
  amount: 'Amount',
  dateFormat: 'YYYY-MM-DD',
};

describe('parseAccountCsv — balance column', () => {
  it('parses a mapped balance column into pence', () => {
    const csv = 'Date,Description,Amount,Balance\n2026-01-01,Coffee,-350,1200.50\n';
    const rows = parseAccountCsv(csv, { ...baseMapping, balance: 'Balance' });
    expect(rows[0]?.balanceAfter).toBe(120050);
  });

  it('returns null for a blank balance cell', () => {
    const csv = 'Date,Description,Amount,Balance\n2026-01-01,Coffee,-350,\n';
    const rows = parseAccountCsv(csv, { ...baseMapping, balance: 'Balance' });
    expect(rows[0]?.balanceAfter).toBeNull();
  });

  it('returns null when the mapped balance column is absent from the row', () => {
    const csv = 'Date,Description,Amount\n2026-01-01,Coffee,-350\n';
    const rows = parseAccountCsv(csv, { ...baseMapping, balance: 'Balance' });
    expect(rows[0]?.balanceAfter).toBeNull();
  });

  it('returns null for every row when no balance column is mapped', () => {
    const csv = 'Date,Description,Amount\n2026-01-01,Coffee,-350\n2026-01-02,Lunch,-800\n';
    const rows = parseAccountCsv(csv, baseMapping);
    expect(rows.every((row) => row.balanceAfter === null)).toBe(true);
  });

  it('throws when a mapped balance cell is present but unparseable', () => {
    const csv = 'Date,Description,Amount,Balance\n2026-01-01,Coffee,-350,not-a-number\n';
    expect(() => parseAccountCsv(csv, { ...baseMapping, balance: 'Balance' })).toThrow(
      /Cannot parse amount/,
    );
  });
});
