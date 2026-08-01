import { describe, expect, it } from 'vitest';
import { groupHoldingsByMonth } from './holdingsByMonth';
import type { ValuationForHoldings } from './holdingsByMonth';

describe('groupHoldingsByMonth', () => {
  it('returns an empty array for no valuations', () => {
    expect(groupHoldingsByMonth([], '2026-03')).toEqual([]);
  });

  it('forward-fills a single valuation across every subsequent month up to currentMonth', () => {
    const rows: ValuationForHoldings[] = [
      { investmentId: 1, investmentName: 'ISA', asOfDate: '2026-01-15', value: 10000 },
    ];

    const result = groupHoldingsByMonth(rows, '2026-03');

    expect(result).toEqual([
      { month: '2026-01', investmentId: 1, investmentName: 'ISA', value: 10000 },
      { month: '2026-02', investmentId: 1, investmentName: 'ISA', value: 10000 },
      { month: '2026-03', investmentId: 1, investmentName: 'ISA', value: 10000 },
    ]);
  });

  it('switches to a newer valuation from the month it lands in, not before', () => {
    const rows: ValuationForHoldings[] = [
      { investmentId: 1, investmentName: 'ISA', asOfDate: '2026-01-01', value: 10000 },
      { investmentId: 1, investmentName: 'ISA', asOfDate: '2026-03-01', value: 12000 },
    ];

    const result = groupHoldingsByMonth(rows, '2026-04');
    const values = result.map((r) => [r.month, r.value]);

    expect(values).toEqual([
      ['2026-01', 10000],
      ['2026-02', 10000],
      ['2026-03', 12000],
      ['2026-04', 12000],
    ]);
  });

  it('omits an investment from months before its first valuation, instead of zeroing it', () => {
    const rows: ValuationForHoldings[] = [
      { investmentId: 1, investmentName: 'ISA', asOfDate: '2026-01-01', value: 10000 },
      { investmentId: 2, investmentName: 'Pension', asOfDate: '2026-03-01', value: 5000 },
    ];

    const result = groupHoldingsByMonth(rows, '2026-03');

    const januaryRows = result.filter((r) => r.month === '2026-01');
    expect(januaryRows).toEqual([{ month: '2026-01', investmentId: 1, investmentName: 'ISA', value: 10000 }]);
    const marchRows = result.filter((r) => r.month === '2026-03');
    expect(marchRows).toHaveLength(2);
  });

  it('handles a gap of several months between valuations by carrying the last value forward', () => {
    const rows: ValuationForHoldings[] = [
      { investmentId: 1, investmentName: 'ISA', asOfDate: '2026-01-01', value: 10000 },
      { investmentId: 1, investmentName: 'ISA', asOfDate: '2026-06-01', value: 11000 },
    ];

    const result = groupHoldingsByMonth(rows, '2026-06');
    const aprilRow = result.find((r) => r.month === '2026-04');

    expect(aprilRow?.value).toBe(10000);
    expect(result).toHaveLength(6);
  });

  it('spans a year boundary correctly', () => {
    const rows: ValuationForHoldings[] = [
      { investmentId: 1, investmentName: 'ISA', asOfDate: '2025-11-01', value: 10000 },
    ];

    const result = groupHoldingsByMonth(rows, '2026-02');

    expect(result.map((r) => r.month)).toEqual(['2025-11', '2025-12', '2026-01', '2026-02']);
  });

  it('sorts output by month then investment name', () => {
    const rows: ValuationForHoldings[] = [
      { investmentId: 2, investmentName: 'Pension', asOfDate: '2026-01-01', value: 5000 },
      { investmentId: 1, investmentName: 'ISA', asOfDate: '2026-01-01', value: 10000 },
    ];

    const result = groupHoldingsByMonth(rows, '2026-01');

    expect(result.map((r) => r.investmentName)).toEqual(['ISA', 'Pension']);
  });
});
