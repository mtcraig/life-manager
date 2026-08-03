import { describe, expect, it } from 'vitest';
import { computeBudgetProgress, getMonthRange, sumActualSpendByCategory } from './budgets';

describe('sumActualSpendByCategory', () => {
  it('sums spend per category as a positive magnitude', () => {
    const result = sumActualSpendByCategory([
      { categoryId: 1, amount: -1000, isTransfer: false },
      { categoryId: 1, amount: -500, isTransfer: false },
      { categoryId: 2, amount: -200, isTransfer: false },
    ]);
    expect(result.get(1)).toBe(1500);
    expect(result.get(2)).toBe(200);
  });

  it('excludes transfers', () => {
    const result = sumActualSpendByCategory([{ categoryId: 1, amount: -1000, isTransfer: true }]);
    expect(result.has(1)).toBe(false);
  });

  it('excludes uncategorised rows', () => {
    const result = sumActualSpendByCategory([{ categoryId: null, amount: -1000, isTransfer: false }]);
    expect(result.size).toBe(0);
  });

  it('excludes money-in rows', () => {
    const result = sumActualSpendByCategory([{ categoryId: 1, amount: 1000, isTransfer: false }]);
    expect(result.has(1)).toBe(false);
  });
});

describe('computeBudgetProgress', () => {
  const categoryNames = new Map([
    [1, 'Groceries'],
    [2, 'Dining out'],
  ]);

  it('joins budgeted categories against actual spend', () => {
    const { items, totalBudgeted, totalActual } = computeBudgetProgress(
      [{ id: 1, categoryId: 1, amount: 40000, startDate: '2026-01-01', endDate: null }],
      new Map([[1, 32000]]),
      categoryNames,
    );
    expect(items).toEqual([
      { categoryId: 1, categoryName: 'Groceries', budgeted: 40000, actual: 32000, delta: 8000 },
    ]);
    expect(totalBudgeted).toBe(40000);
    expect(totalActual).toBe(32000);
  });

  it('treats a category with no actual spend as zero', () => {
    const { items } = computeBudgetProgress(
      [{ id: 1, categoryId: 1, amount: 40000, startDate: '2026-01-01', endDate: null }],
      new Map(),
      categoryNames,
    );
    expect(items[0]!.actual).toBe(0);
    expect(items[0]!.delta).toBe(40000);
  });

  it('picks the budget row with the latest startDate when overlapping ranges exist for a category', () => {
    const { items } = computeBudgetProgress(
      [
        { id: 1, categoryId: 1, amount: 40000, startDate: '2026-01-01', endDate: null },
        { id: 2, categoryId: 1, amount: 50000, startDate: '2026-06-01', endDate: null },
      ],
      new Map(),
      categoryNames,
    );
    expect(items).toHaveLength(1);
    expect(items[0]!.budgeted).toBe(50000);
  });

  it('sorts items by category name', () => {
    const { items } = computeBudgetProgress(
      [
        { id: 1, categoryId: 1, amount: 40000, startDate: '2026-01-01', endDate: null },
        { id: 2, categoryId: 2, amount: 10000, startDate: '2026-01-01', endDate: null },
      ],
      new Map(),
      categoryNames,
    );
    expect(items.map((i) => i.categoryName)).toEqual(['Dining out', 'Groceries']);
  });
});

describe('getMonthRange', () => {
  it('returns the first and last day of the month', () => {
    expect(getMonthRange('2026-08-17')).toEqual({ periodStart: '2026-08-01', periodEnd: '2026-08-31' });
  });

  it('handles a 30-day month', () => {
    expect(getMonthRange('2026-04-05')).toEqual({ periodStart: '2026-04-01', periodEnd: '2026-04-30' });
  });

  it('handles February in a leap year', () => {
    expect(getMonthRange('2028-02-10')).toEqual({ periodStart: '2028-02-01', periodEnd: '2028-02-29' });
  });

  it('handles February in a non-leap year', () => {
    expect(getMonthRange('2026-02-10')).toEqual({ periodStart: '2026-02-01', periodEnd: '2026-02-28' });
  });
});
