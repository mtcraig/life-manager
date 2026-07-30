import { describe, expect, it } from 'vitest';
import { groupCategorySummaryByMonth } from './categorySummaryByMonth';

describe('groupCategorySummaryByMonth', () => {
  it('sums spending per month/category as a positive magnitude', () => {
    const result = groupCategorySummaryByMonth([
      { date: '2026-01-05', amount: -500, categoryId: 1, categoryName: 'Groceries' },
      { date: '2026-01-20', amount: -300, categoryId: 1, categoryName: 'Groceries' },
      { date: '2026-02-03', amount: -1500, categoryId: 2, categoryName: 'Rent' },
    ]);

    expect(result).toEqual([
      { month: '2026-01', categoryId: 1, categoryName: 'Groceries', total: 800 },
      { month: '2026-02', categoryId: 2, categoryName: 'Rent', total: 1500 },
    ]);
  });

  it('keeps multiple categories separate within the same month, sorted by total descending', () => {
    const result = groupCategorySummaryByMonth([
      { date: '2026-03-01', amount: -200, categoryId: 1, categoryName: 'Groceries' },
      { date: '2026-03-02', amount: -900, categoryId: 2, categoryName: 'Rent' },
    ]);

    expect(result).toEqual([
      { month: '2026-03', categoryId: 2, categoryName: 'Rent', total: 900 },
      { month: '2026-03', categoryId: 1, categoryName: 'Groceries', total: 200 },
    ]);
  });

  it('excludes money-in rows', () => {
    const result = groupCategorySummaryByMonth([
      { date: '2026-01-01', amount: 1000, categoryId: 1, categoryName: 'Salary' },
      { date: '2026-01-02', amount: -200, categoryId: 2, categoryName: 'Groceries' },
    ]);

    expect(result).toEqual([{ month: '2026-01', categoryId: 2, categoryName: 'Groceries', total: 200 }]);
  });

  it('groups uncategorised spending (null categoryId) under "Uncategorised"', () => {
    const result = groupCategorySummaryByMonth([
      { date: '2026-01-01', amount: -400, categoryId: null, categoryName: null },
      { date: '2026-01-02', amount: -100, categoryId: null, categoryName: null },
    ]);

    expect(result).toEqual([{ month: '2026-01', categoryId: null, categoryName: 'Uncategorised', total: 500 }]);
  });

  it('includes transfer-category spending as its own slice, not excluded', () => {
    const result = groupCategorySummaryByMonth([
      { date: '2026-01-01', amount: -1000, categoryId: 3, categoryName: 'Transfers' },
    ]);

    expect(result).toEqual([{ month: '2026-01', categoryId: 3, categoryName: 'Transfers', total: 1000 }]);
  });

  it('omits months with no spending rather than fabricating a zero entry', () => {
    const result = groupCategorySummaryByMonth([
      { date: '2026-01-01', amount: -100, categoryId: 1, categoryName: 'Groceries' },
    ]);

    expect(result.map((row) => row.month)).toEqual(['2026-01']);
  });

  it('returns an empty array for no rows', () => {
    expect(groupCategorySummaryByMonth([])).toEqual([]);
  });
});
