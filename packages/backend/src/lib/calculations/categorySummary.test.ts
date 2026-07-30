import { describe, expect, it } from 'vitest';
import { groupCategorySummary } from './categorySummary';

describe('groupCategorySummary', () => {
  it('sums spending per category as a positive magnitude, sorted descending', () => {
    const result = groupCategorySummary([
      { amount: -500, categoryId: 1, categoryName: 'Groceries' },
      { amount: -1500, categoryId: 2, categoryName: 'Rent' },
      { amount: -300, categoryId: 1, categoryName: 'Groceries' },
    ]);

    expect(result).toEqual([
      { categoryId: 2, categoryName: 'Rent', total: 1500 },
      { categoryId: 1, categoryName: 'Groceries', total: 800 },
    ]);
  });

  it('excludes money-in rows', () => {
    const result = groupCategorySummary([
      { amount: 1000, categoryId: 1, categoryName: 'Salary' },
      { amount: -200, categoryId: 2, categoryName: 'Groceries' },
    ]);

    expect(result).toEqual([{ categoryId: 2, categoryName: 'Groceries', total: 200 }]);
  });

  it('groups uncategorised spending (null categoryId) under "Uncategorised"', () => {
    const result = groupCategorySummary([
      { amount: -400, categoryId: null, categoryName: null },
      { amount: -100, categoryId: null, categoryName: null },
    ]);

    expect(result).toEqual([{ categoryId: null, categoryName: 'Uncategorised', total: 500 }]);
  });

  it('includes transfer-category spending as its own slice, not excluded', () => {
    const result = groupCategorySummary([{ amount: -1000, categoryId: 3, categoryName: 'Transfers' }]);

    expect(result).toEqual([{ categoryId: 3, categoryName: 'Transfers', total: 1000 }]);
  });

  it('returns an empty array for no rows', () => {
    expect(groupCategorySummary([])).toEqual([]);
  });
});
