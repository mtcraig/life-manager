import { describe, expect, it } from 'vitest';
import { detectRecurringItems } from './recurringItems';
import type { RecurringAnalysisRow } from './recurringItems';

const ASOF = '2026-08-15';

function row(
  date: string,
  amount: number,
  normalizedDescription: string,
  categoryId: number | null = 1,
  isTransfer = false,
): RecurringAnalysisRow {
  return { date, amount, normalizedDescription, categoryId, isTransfer };
}

describe('detectRecurringItems', () => {
  it('detects a clean monthly salary pattern', () => {
    const items = detectRecurringItems(
      [
        row('2026-05-01', 320000, 'ACME CORP SALARY', 5),
        row('2026-06-01', 320000, 'ACME CORP SALARY', 5),
        row('2026-07-01', 320000, 'ACME CORP SALARY', 5),
        row('2026-08-01', 320000, 'ACME CORP SALARY', 5),
      ],
      ASOF,
    );
    expect(items).toEqual([
      {
        normalizedDescription: 'ACME CORP SALARY',
        categoryId: 5,
        averageAmount: 320000,
        cadence: 'monthly',
        lastDate: '2026-08-01',
        nextExpectedDate: '2026-08-31',
        sampleCount: 4,
      },
    ]);
  });

  it('detects a clean monthly mortgage bill', () => {
    const items = detectRecurringItems(
      [
        row('2026-06-01', -145000, 'MORTGAGE PAYMENT', 20),
        row('2026-07-01', -145000, 'MORTGAGE PAYMENT', 20),
        row('2026-08-01', -145000, 'MORTGAGE PAYMENT', 20),
      ],
      ASOF,
    );
    expect(items).toHaveLength(1);
    expect(items[0]!.cadence).toBe('monthly');
    expect(items[0]!.averageAmount).toBe(-145000);
  });

  it('detects a weekly cadence', () => {
    const items = detectRecurringItems(
      [
        row('2026-07-25', -2000, 'CLEANER', 3),
        row('2026-08-01', -2000, 'CLEANER', 3),
        row('2026-08-08', -2000, 'CLEANER', 3),
        row('2026-08-15', -2000, 'CLEANER', 3),
      ],
      ASOF,
    );
    expect(items).toHaveLength(1);
    expect(items[0]!.cadence).toBe('weekly');
    expect(items[0]!.nextExpectedDate).toBe('2026-08-22');
  });

  it('requires at least 3 occurrences', () => {
    const items = detectRecurringItems(
      [row('2026-06-01', -1599, 'NETFLIX', 9), row('2026-07-01', -1599, 'NETFLIX', 9)],
      ASOF,
    );
    expect(items).toEqual([]);
  });

  it('does not detect a one-off transaction that happens to share a description with a real recurring series, when it breaks the gap pattern', () => {
    const items = detectRecurringItems(
      [
        row('2026-05-01', -145000, 'MORTGAGE PAYMENT', 20),
        row('2026-05-15', -145000, 'MORTGAGE PAYMENT', 20), // stray mid-month duplicate
        row('2026-06-01', -145000, 'MORTGAGE PAYMENT', 20),
        row('2026-07-01', -145000, 'MORTGAGE PAYMENT', 20),
      ],
      ASOF,
    );
    expect(items).toEqual([]);
  });

  it('does not detect a one-off transaction that shares a description but a very different amount', () => {
    const items = detectRecurringItems(
      [
        row('2026-05-01', -1599, 'NETFLIX', 9),
        row('2026-06-01', -1599, 'NETFLIX', 9),
        row('2026-07-01', -9999, 'NETFLIX', 9), // one-off, much larger
      ],
      ASOF,
    );
    expect(items).toEqual([]);
  });

  it('does not project a subscription cancelled 4 months ago', () => {
    const items = detectRecurringItems(
      [
        row('2026-01-01', -1599, 'OLD GYM MEMBERSHIP', 14),
        row('2026-02-01', -1599, 'OLD GYM MEMBERSHIP', 14),
        row('2026-03-01', -1599, 'OLD GYM MEMBERSHIP', 14),
        row('2026-04-01', -1599, 'OLD GYM MEMBERSHIP', 14),
      ],
      ASOF, // 2026-08-15, ~4.5 months after the last occurrence
    );
    expect(items).toEqual([]);
  });

  it('excludes transfers', () => {
    const items = detectRecurringItems(
      [
        row('2026-06-01', 50000, 'SAVINGS TRANSFER', 1, true),
        row('2026-07-01', 50000, 'SAVINGS TRANSFER', 1, true),
        row('2026-08-01', 50000, 'SAVINGS TRANSFER', 1, true),
      ],
      ASOF,
    );
    expect(items).toEqual([]);
  });

  it('tolerates small amount variation within 5%', () => {
    const items = detectRecurringItems(
      [
        row('2026-06-01', -9500, 'ENERGY DIRECT DEBIT', 3),
        row('2026-07-01', -9800, 'ENERGY DIRECT DEBIT', 3),
        row('2026-08-01', -9600, 'ENERGY DIRECT DEBIT', 3),
      ],
      ASOF,
    );
    expect(items).toHaveLength(1);
  });

  it('rejects amount variation beyond 5%', () => {
    const items = detectRecurringItems(
      [
        row('2026-06-01', -9000, 'VARIABLE BILL', 3),
        row('2026-07-01', -11000, 'VARIABLE BILL', 3),
        row('2026-08-01', -9500, 'VARIABLE BILL', 3),
      ],
      ASOF,
    );
    expect(items).toEqual([]);
  });
});
