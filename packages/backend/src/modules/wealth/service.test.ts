import { describe, expect, it, vi } from 'vitest';

vi.mock('../accounts/repo', () => ({
  listAccounts: vi.fn(() => [{ id: 1, name: 'Current', type: 'current' }]),
}));

vi.mock('../transactions/repo', () => ({
  listTransactionAmountsWithTransferFlag: vi.fn(() => [
    { date: '2026-06-15', amount: 100000, isTransfer: false, balanceAfter: null },
  ]),
  getEarliestTransactionDate: vi.fn(() => '2026-06-15'),
}));

vi.mock('../investments/repo', () => ({
  listAllValuationRows: vi.fn(() => []),
  listInvestments: vi.fn(() => []),
}));

vi.mock('../properties/repo', () => ({
  listAllValuationRows: vi.fn(() => [{ entityId: 10, asOfDate: '2026-06-01', value: 50000000 }]),
  listProperties: vi.fn(() => [{ id: 10, archivedAt: null }]),
}));

vi.mock('../liabilities/repo', () => ({
  listAllValuationRows: vi.fn(() => []),
  listLiabilities: vi.fn(() => []),
}));

vi.mock('../contents/repo', () => ({
  sumAllValues: vi.fn(() => 20000),
}));

const { getNetWorthTrend } = await import('./service');

describe('getNetWorthTrend', () => {
  it('builds one point per month from the earliest data to today, ending at today', () => {
    const result = getNetWorthTrend();
    const today = new Date().toISOString().slice(0, 10);
    expect(result.length).toBeGreaterThan(0);
    expect(result[result.length - 1]!.date).toBe(today);
  });

  it('includes the account balance and property valuation in the final point', () => {
    const result = getNetWorthTrend();
    const last = result[result.length - 1]!;
    expect(last.accountsTotal).toBe(100000);
    expect(last.propertiesTotal).toBe(50000000);
    expect(last.contentsTotal).toBe(20000);
    expect(last.netWorth).toBe(100000 + 50000000 + 20000);
  });
});
