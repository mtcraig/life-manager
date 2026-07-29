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
      { date: '2026-01-01', balance: 1000, confirmed: false },
      { date: '2026-01-02', balance: 1500, confirmed: false },
      { date: '2026-01-03', balance: 1200, confirmed: false },
    ]);
  });

  it('sums multiple same-day transactions into a single point', () => {
    const result = computeBalanceTrend([
      { date: '2026-01-01', amount: 1000 },
      { date: '2026-01-01', amount: -400 },
    ]);
    expect(result).toEqual([{ date: '2026-01-01', balance: 600, confirmed: false }]);
  });

  it('returns an empty array for no transactions', () => {
    expect(computeBalanceTrend([])).toEqual([]);
  });

  it('stays unconfirmed until the first bank-reported balance, then confirmed from there on', () => {
    const result = computeBalanceTrend([
      { date: '2026-01-01', amount: 1000 },
      { date: '2026-01-02', amount: 500, balanceAfter: 9000 },
      { date: '2026-01-03', amount: -300 },
    ]);

    expect(result).toEqual([
      { date: '2026-01-01', balance: 1000, confirmed: false },
      { date: '2026-01-02', balance: 9000, confirmed: true },
      { date: '2026-01-03', balance: 8700, confirmed: true },
    ]);
  });

  it('snaps to the reported balance even when it corrects for drift, not just adds the delta', () => {
    // Naive running total after day 2 would be 1000 + 500 = 1500, but the bank
    // reports 9000 (e.g. because earlier history wasn't imported) — the snap
    // must override to 9000, not add 500 to the previous computed value.
    const result = computeBalanceTrend([
      { date: '2026-01-01', amount: 1000 },
      { date: '2026-01-02', amount: 500, balanceAfter: 9000 },
    ]);
    expect(result[1]).toEqual({ date: '2026-01-02', balance: 9000, confirmed: true });
  });

  it('uses the last same-day row (by input order) as that date\'s snap when several carry a balance', () => {
    const result = computeBalanceTrend([
      { date: '2026-01-01', amount: 100, balanceAfter: 1100 },
      { date: '2026-01-01', amount: 200, balanceAfter: 1300 },
      { date: '2026-01-01', amount: -50, balanceAfter: 1250 },
    ]);
    expect(result).toEqual([{ date: '2026-01-01', balance: 1250, confirmed: true }]);
  });

  it('carries the running total forward via deltas after the last known snap', () => {
    const result = computeBalanceTrend([
      { date: '2026-01-01', amount: 1000, balanceAfter: 5000 },
      { date: '2026-01-02', amount: 200 },
      { date: '2026-01-03', amount: -100 },
    ]);
    expect(result).toEqual([
      { date: '2026-01-01', balance: 5000, confirmed: true },
      { date: '2026-01-02', balance: 5200, confirmed: true },
      { date: '2026-01-03', balance: 5100, confirmed: true },
    ]);
  });
});
