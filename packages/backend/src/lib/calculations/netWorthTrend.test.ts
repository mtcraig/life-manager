import { describe, expect, it } from 'vitest';
import { buildMonthlyDateAxis, computeNetWorthTrend } from './netWorthTrend';

describe('buildMonthlyDateAxis', () => {
  it('produces one month-end per month, clamping the final point to today', () => {
    expect(buildMonthlyDateAxis('2026-06-10', '2026-08-15')).toEqual([
      '2026-06-30',
      '2026-07-31',
      '2026-08-15', // clamped — August hasn't ended yet
    ]);
  });

  it('returns a single clamped point when earliest and today are in the same month', () => {
    expect(buildMonthlyDateAxis('2026-08-01', '2026-08-15')).toEqual(['2026-08-15']);
  });

  it('handles a leap-year February month-end correctly', () => {
    expect(buildMonthlyDateAxis('2028-02-01', '2028-03-01')).toEqual(['2028-02-29', '2028-03-01']);
  });
});

describe('computeNetWorthTrend', () => {
  const baseInput = {
    dateAxis: ['2026-06-30', '2026-07-31', '2026-08-15'],
    accountSeries: [],
    investmentValuations: [],
    investmentEntities: [],
    propertyValuations: [],
    propertyEntities: [],
    liabilityValuations: [],
    liabilityEntities: [],
    contentsTotal: 0,
  };

  it('forward-fills an account balance to every later month-end', () => {
    const result = computeNetWorthTrend({
      ...baseInput,
      accountSeries: [
        { accountId: 1, isCreditCard: false, points: [{ date: '2026-06-15', balance: 100000 }] },
      ],
    });
    expect(result.map((p) => p.accountsTotal)).toEqual([100000, 100000, 100000]);
  });

  it('picks up a later balance once its date arrives', () => {
    const result = computeNetWorthTrend({
      ...baseInput,
      accountSeries: [
        {
          accountId: 1,
          isCreditCard: false,
          points: [
            { date: '2026-06-15', balance: 100000 },
            { date: '2026-07-20', balance: 150000 },
          ],
        },
      ],
    });
    expect(result.map((p) => p.accountsTotal)).toEqual([100000, 150000, 150000]);
  });

  it('folds a credit card balance into liabilitiesTotal, floored at zero when in credit', () => {
    const result = computeNetWorthTrend({
      ...baseInput,
      accountSeries: [{ accountId: 2, isCreditCard: true, points: [{ date: '2026-06-01', balance: -5000 }] }],
    });
    expect(result[0]!.accountsTotal).toBe(0);
    expect(result[0]!.liabilitiesTotal).toBe(5000);
  });

  it('does not add a negative liability when a credit card is in credit', () => {
    const result = computeNetWorthTrend({
      ...baseInput,
      accountSeries: [{ accountId: 2, isCreditCard: true, points: [{ date: '2026-06-01', balance: 3000 }] }],
    });
    expect(result[0]!.liabilitiesTotal).toBe(0);
  });

  it('forward-fills a sparsely-valued property across months with no new valuation', () => {
    const result = computeNetWorthTrend({
      ...baseInput,
      propertyValuations: [{ entityId: 10, asOfDate: '2026-01-01', value: 300000000 }],
      propertyEntities: [{ id: 10, archivedAt: null }],
    });
    expect(result.map((p) => p.propertiesTotal)).toEqual([300000000, 300000000, 300000000]);
  });

  it('excludes an entity that was archived before the earliest data even existed', () => {
    const result = computeNetWorthTrend({
      ...baseInput,
      propertyValuations: [{ entityId: 10, asOfDate: '2026-01-01', value: 300000000 }],
      propertyEntities: [{ id: 10, archivedAt: '2020-01-01' }],
    });
    expect(result.every((p) => p.propertiesTotal === 0)).toBe(true);
  });

  it('does not retroactively erase a liability from historical points once it is archived — only from its archival date onward', () => {
    // Reproduces the mortgage-payoff bug: a liability held a real balance for
    // years, was paid off, and was archived today. Points before the archival
    // date must still reflect its true historical balance.
    const result = computeNetWorthTrend({
      ...baseInput,
      dateAxis: ['2026-06-30', '2026-07-15', '2026-07-31'],
      liabilityValuations: [
        { entityId: 20, asOfDate: '2026-01-01', value: 150000 },
        { entityId: 20, asOfDate: '2026-07-10', value: 0 }, // paid off
      ],
      liabilityEntities: [{ id: 20, archivedAt: '2026-07-20' }], // archived after payoff
    });
    expect(result.map((p) => p.liabilitiesTotal)).toEqual([150000, 0, 0]);
  });

  it('excludes a liability from any point on or after its archival date, even if it still had a nonzero recorded balance', () => {
    const result = computeNetWorthTrend({
      ...baseInput,
      dateAxis: ['2026-06-30', '2026-07-31'],
      liabilityValuations: [{ entityId: 20, asOfDate: '2026-01-01', value: 150000 }],
      liabilityEntities: [{ id: 20, archivedAt: '2026-07-01' }],
    });
    expect(result.map((p) => p.liabilitiesTotal)).toEqual([150000, 0]);
  });

  it('holds contentsTotal constant across every point', () => {
    const result = computeNetWorthTrend({ ...baseInput, contentsTotal: 12345 });
    expect(result.every((p) => p.contentsTotal === 12345)).toBe(true);
  });

  it('computes netWorth as assets minus liabilities', () => {
    const result = computeNetWorthTrend({
      ...baseInput,
      accountSeries: [{ accountId: 1, isCreditCard: false, points: [{ date: '2026-06-01', balance: 100000 }] }],
      propertyValuations: [{ entityId: 10, asOfDate: '2026-06-01', value: 50000 }],
      propertyEntities: [{ id: 10, archivedAt: null }],
      liabilityValuations: [{ entityId: 20, asOfDate: '2026-06-01', value: 30000 }],
      liabilityEntities: [{ id: 20, archivedAt: null }],
      contentsTotal: 5000,
    });
    expect(result[0]!.netWorth).toBe(100000 + 50000 + 5000 - 30000);
  });
});
