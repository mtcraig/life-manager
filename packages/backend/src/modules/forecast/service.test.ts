import { describe, expect, it, vi } from 'vitest';

vi.mock('../accounts/repo', () => ({
  listAccounts: vi.fn(() => [
    { id: 1, name: 'Current', type: 'current' },
    { id: 2, name: 'Savings', type: 'savings' },
  ]),
}));

const TODAY = new Date().toISOString().slice(0, 10);

function isoMonthsAgo(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString().slice(0, 10);
}

vi.mock('../transactions/repo', () => ({
  listTransactionAmountsWithTransferFlag: vi.fn((params: { accountId?: number }) => {
    if (params.accountId === 1) return [{ date: TODAY, amount: 50000, isTransfer: false, balanceAfter: 50000 }];
    if (params.accountId === 2) return [{ date: TODAY, amount: 30000, isTransfer: false, balanceAfter: 30000 }];
    return [];
  }),
  listTransactionsForRecurringAnalysis: vi.fn(() => [
    // A clean recurring monthly bill, well within tolerance and recent enough not to be stale.
    { date: isoMonthsAgo(2), amount: -5000, normalizedDescription: 'GYM', categoryId: 14, isTransfer: false },
    { date: isoMonthsAgo(1), amount: -5000, normalizedDescription: 'GYM', categoryId: 14, isTransfer: false },
    { date: TODAY, amount: -5000, normalizedDescription: 'GYM', categoryId: 14, isTransfer: false },
    // Variable spend in a different category, only within the trailing 3 months.
    { date: isoMonthsAgo(1), amount: -9000, normalizedDescription: 'TESCO', categoryId: 2, isTransfer: false },
  ]),
}));

const { getForecast } = await import('./service');

describe('getForecast', () => {
  it('sums balances across all accounts when no accountId is given', () => {
    const result = getForecast(undefined, 5);
    expect(result.accountId).toBeNull();
    expect(result.asOfBalance).toBe(80000);
  });

  it('scopes to a single account when accountId is given', () => {
    const result = getForecast(1, 5);
    expect(result.accountId).toBe(1);
    expect(result.asOfBalance).toBe(50000);
  });

  it('surfaces the detected recurring item', () => {
    const result = getForecast(undefined, 5);
    expect(result.recurringItems).toHaveLength(1);
    expect(result.recurringItems[0]!.description).toBe('GYM');
    expect(result.recurringItems[0]!.cadence).toBe('monthly');
  });

  it("excludes the recurring item's own category from the variable-spend decrement, avoiding double-counting", () => {
    const result = getForecast(undefined, 5);
    const totalDrop = result.asOfBalance - result.points[4]!.projectedBalance;
    // Only TESCO (categoryId 2, ~3000/month) should contribute to the daily
    // decrement — GYM (categoryId 14, ~15000/month) is already a recognised
    // recurring item, so including it here too would roughly quadruple the drop.
    expect(totalDrop).toBeGreaterThan(0);
    expect(totalDrop).toBeLessThan(1000);
  });
});
