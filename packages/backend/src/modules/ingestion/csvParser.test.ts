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

describe('parseAccountCsv — single amount column', () => {
  it('treats a blank amount cell as 0 instead of throwing', () => {
    const csv = 'Date,Description,Amount\n2026-01-01,Annual fee waiver,\n';
    const rows = parseAccountCsv(csv, baseMapping);
    expect(rows[0]?.amount).toBe(0);
  });

  it('still throws when a mapped amount cell is present but unparseable', () => {
    const csv = 'Date,Description,Amount\n2026-01-01,Coffee,not-a-number\n';
    expect(() => parseAccountCsv(csv, baseMapping)).toThrow(/Cannot parse amount/);
  });
});

describe('parseAccountCsv — debit/credit columns', () => {
  const debitCreditMapping: ColumnMapping = {
    date: 'Date',
    description: 'Description',
    debit: 'Debit',
    credit: 'Credit',
    dateFormat: 'YYYY-MM-DD',
  };

  it('treats a blank credit cell as 0 on a debit row', () => {
    const csv = 'Date,Description,Debit,Credit\n2026-01-01,Coffee,3.50,\n';
    const rows = parseAccountCsv(csv, debitCreditMapping);
    expect(rows[0]?.amount).toBe(-350);
  });

  it('treats a blank debit cell as 0 on a credit row', () => {
    const csv = 'Date,Description,Debit,Credit\n2026-01-01,Refund,,3.50\n';
    const rows = parseAccountCsv(csv, debitCreditMapping);
    expect(rows[0]?.amount).toBe(350);
  });

  it('throws when a mapped debit/credit column is missing from the row entirely', () => {
    const csv = 'Date,Description,Debit\n2026-01-01,Coffee,3.50\n';
    expect(() => parseAccountCsv(csv, debitCreditMapping)).toThrow(/Missing expected "credit"/);
  });
});

describe('parseAccountCsv — credit_card sign convention', () => {
  const mapping: ColumnMapping = {
    date: 'Date',
    description: 'Description',
    amount: 'Amount',
    dateFormat: 'YYYY-MM-DD',
  };

  it('negates the amount for a credit_card account (spend positive -> negative)', () => {
    const csv = 'Date,Description,Amount\n2026-01-01,Shop,19.99\n';
    const rows = parseAccountCsv(csv, mapping, 'credit_card');
    expect(rows[0]?.amount).toBe(-1999);
  });

  it('negates the amount for a credit_card account (payment negative -> positive)', () => {
    const csv = 'Date,Description,Amount\n2026-01-01,Payment,-19.99\n';
    const rows = parseAccountCsv(csv, mapping, 'credit_card');
    expect(rows[0]?.amount).toBe(1999);
  });

  it('does not negate for a non-credit_card account', () => {
    const csv = 'Date,Description,Amount\n2026-01-01,Shop,19.99\n';
    const rows = parseAccountCsv(csv, mapping, 'current');
    expect(rows[0]?.amount).toBe(1999);
  });

  it('does not negate when accountType is omitted', () => {
    const csv = 'Date,Description,Amount\n2026-01-01,Shop,19.99\n';
    const rows = parseAccountCsv(csv, mapping);
    expect(rows[0]?.amount).toBe(1999);
  });

  it('negates a mapped balance column for a credit_card account (bank-reported amount owed -> negative)', () => {
    const csv = 'Date,Description,Amount,Balance\n2026-01-01,Shop,19.99,445.82\n';
    const rows = parseAccountCsv(csv, { ...mapping, balance: 'Balance' }, 'credit_card');
    expect(rows[0]?.balanceAfter).toBe(-44582);
  });

  it('does not negate a mapped balance column for a non-credit_card account', () => {
    const csv = 'Date,Description,Amount,Balance\n2026-01-01,Shop,19.99,445.82\n';
    const rows = parseAccountCsv(csv, { ...mapping, balance: 'Balance' }, 'current');
    expect(rows[0]?.balanceAfter).toBe(44582);
  });

  it('leaves a null balance null for a credit_card account', () => {
    const csv = 'Date,Description,Amount,Balance\n2026-01-01,Shop,19.99,\n';
    const rows = parseAccountCsv(csv, { ...mapping, balance: 'Balance' }, 'credit_card');
    expect(rows[0]?.balanceAfter).toBeNull();
  });
});
