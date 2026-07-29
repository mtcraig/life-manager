import { describe, expect, it } from 'vitest';
import { computeBalanceTrend } from './balanceTrend';

describe('computeBalanceTrend', () => {
  it('produces a running cumulative balance sorted by date', () => {
    const result = computeBalanceTrend([
      { date: '2026-01-01', amount: 1000 },
      { date: '2026-01-03', amount: -300 },
      { date: '2026-01-02', amount: 500 },
    ]);

    expect(result).toEqual([
      { date: '2026-01-01', balance: 1000 },
      { date: '2026-01-02', balance: 1500 },
      { date: '2026-01-03', balance: 1200 },
    ]);
  });

  it('sums multiple same-day transactions into a single point', () => {
    const result = computeBalanceTrend([
      { date: '2026-01-01', amount: 1000 },
      { date: '2026-01-01', amount: -400 },
    ]);
    expect(result).toEqual([{ date: '2026-01-01', balance: 600 }]);
  });

  it('returns an empty array for no transactions', () => {
    expect(computeBalanceTrend([])).toEqual([]);
  });
});
