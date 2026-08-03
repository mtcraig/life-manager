import { describe, expect, it, vi } from 'vitest';

vi.mock('../accounts/repo', () => ({ listAccounts: vi.fn(() => []) }));
vi.mock('../transactions/repo', () => ({
  listTransactionAmountsWithTransferFlag: vi.fn(() => []),
  getEarliestTransactionDate: vi.fn(() => null),
}));
vi.mock('../investments/repo', () => ({ listAllValuationRows: vi.fn(() => []), listInvestments: vi.fn(() => []) }));
vi.mock('../properties/repo', () => ({ listAllValuationRows: vi.fn(() => []), listProperties: vi.fn(() => []) }));
vi.mock('../liabilities/repo', () => ({ listAllValuationRows: vi.fn(() => []), listLiabilities: vi.fn(() => []) }));
vi.mock('../contents/repo', () => ({ sumAllValues: vi.fn(() => 0) }));

const { getNetWorthTrend } = await import('./service');

describe('getNetWorthTrend with no data at all', () => {
  it('returns an empty array rather than a single degenerate point', () => {
    expect(getNetWorthTrend()).toEqual([]);
  });
});
