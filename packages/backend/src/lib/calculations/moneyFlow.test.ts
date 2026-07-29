import { describe, expect, it } from 'vitest';
import { groupMoneyFlowByDate } from './moneyFlow';

describe('groupMoneyFlowByDate', () => {
  it('groups multiple transactions on the same day and sums them', () => {
    const result = groupMoneyFlowByDate([
      { date: '2026-01-02', amount: 1000, isTransfer: false },
      { date: '2026-01-02', amount: -200, isTransfer: false },
      { date: '2026-01-01', amount: -500, isTransfer: false },
    ]);

    expect(result.days).toEqual([
      { date: '2026-01-01', moneyIn: 0, moneyOut: -500, net: -500 },
      { date: '2026-01-02', moneyIn: 1000, moneyOut: -200, net: 800 },
    ]);
    expect(result.totals).toEqual({ moneyIn: 1000, moneyOut: -700, net: 300 });
  });

  it('sorts days ascending regardless of input order', () => {
    const result = groupMoneyFlowByDate([
      { date: '2026-03-01', amount: 100, isTransfer: false },
      { date: '2026-01-01', amount: 100, isTransfer: false },
      { date: '2026-02-01', amount: 100, isTransfer: false },
    ]);
    expect(result.days.map((d) => d.date)).toEqual(['2026-01-01', '2026-02-01', '2026-03-01']);
  });

  it('excludes is_transfer rows from both daily and total figures', () => {
    const result = groupMoneyFlowByDate([
      { date: '2026-01-01', amount: 1000, isTransfer: false },
      { date: '2026-01-01', amount: -1000, isTransfer: true },
    ]);
    expect(result.days).toEqual([{ date: '2026-01-01', moneyIn: 1000, moneyOut: 0, net: 1000 }]);
    expect(result.totals).toEqual({ moneyIn: 1000, moneyOut: 0, net: 1000 });
  });

  it('returns empty days and zeroed totals for no rows', () => {
    expect(groupMoneyFlowByDate([])).toEqual({ days: [], totals: { moneyIn: 0, moneyOut: 0, net: 0 } });
  });
});
