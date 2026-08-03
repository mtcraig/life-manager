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
        confidence: 'high',
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

  it('still detects a solid-cadence series with a one-off amount outlier, but flags it as variable confidence', () => {
    const items = detectRecurringItems(
      [
        row('2026-06-01', -1599, 'NETFLIX', 9),
        row('2026-07-01', -1599, 'NETFLIX', 9),
        row('2026-08-01', -9999, 'NETFLIX', 9), // one-off, much larger
      ],
      ASOF,
    );
    expect(items).toHaveLength(1);
    expect(items[0]!.confidence).toBe('variable');
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

  it('detects a recurring transfer series — transfers are still real balance movements for cash-flow purposes', () => {
    const items = detectRecurringItems(
      [
        row('2026-06-01', 50000, 'SAVINGS TRANSFER', 1, true),
        row('2026-07-01', 50000, 'SAVINGS TRANSFER', 1, true),
        row('2026-08-01', 50000, 'SAVINGS TRANSFER', 1, true),
      ],
      ASOF,
    );
    expect(items).toHaveLength(1);
    expect(items[0]!.confidence).toBe('high');
  });

  it('tolerates small amount variation within 5%, with high confidence', () => {
    const items = detectRecurringItems(
      [
        row('2026-06-01', -9500, 'ENERGY DIRECT DEBIT', 3),
        row('2026-07-01', -9800, 'ENERGY DIRECT DEBIT', 3),
        row('2026-08-01', -9600, 'ENERGY DIRECT DEBIT', 3),
      ],
      ASOF,
    );
    expect(items).toHaveLength(1);
    expect(items[0]!.confidence).toBe('high');
  });

  it('still detects amount variation beyond 5%, but as variable confidence rather than rejecting it', () => {
    const items = detectRecurringItems(
      [
        row('2026-06-01', -9000, 'VARIABLE BILL', 3),
        row('2026-07-01', -11000, 'VARIABLE BILL', 3),
        row('2026-08-01', -9500, 'VARIABLE BILL', 3),
      ],
      ASOF,
    );
    expect(items).toHaveLength(1);
    expect(items[0]!.confidence).toBe('variable');
  });

  it('detects a real credit-card-style monthly payoff: solid cadence, ~195% amount swing, categorised as a transfer', () => {
    const items = detectRecurringItems(
      [
        row('2025-12-08', 45467, 'PAYMENT RECEIVED - THANK YOU', 1, true),
        row('2026-01-07', 32554, 'PAYMENT RECEIVED - THANK YOU', 1, true),
        row('2026-02-07', 27423, 'PAYMENT RECEIVED - THANK YOU', 1, true),
        row('2026-03-10', 74840, 'PAYMENT RECEIVED - THANK YOU', 1, true),
        row('2026-04-07', 54291, 'PAYMENT RECEIVED - THANK YOU', 1, true),
        row('2026-05-08', 130073, 'PAYMENT RECEIVED - THANK YOU', 1, true),
        row('2026-06-07', 48446, 'PAYMENT RECEIVED - THANK YOU', 1, true),
        row('2026-07-08', 60355, 'PAYMENT RECEIVED - THANK YOU', 1, true),
      ],
      '2026-07-20', // within tolerance of the last real occurrence — the account's asOfDate, not the shared ASOF constant
    );
    expect(items).toHaveLength(1);
    expect(items[0]!.cadence).toBe('monthly');
    expect(items[0]!.confidence).toBe('variable');
    expect(items[0]!.averageAmount).toBeGreaterThan(0);
  });
});
