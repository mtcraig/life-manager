import { describe, expect, it, vi } from 'vitest';

vi.mock('../accounts/repo', () => ({ listAccounts: vi.fn(() => []) }));
vi.mock('../transactions/repo', () => ({
  listTransactionAmountsWithTransferFlag: vi.fn(() => []),
  getEarliestTransactionDate: vi.fn(() => '2026-01-01'),
}));
vi.mock('../investments/repo', () => ({ listAllValuationRows: vi.fn(() => []), listInvestments: vi.fn(() => []) }));
vi.mock('../properties/repo', () => ({ listAllValuationRows: vi.fn(() => []), listProperties: vi.fn(() => []) }));
vi.mock('../contents/repo', () => ({ sumAllValues: vi.fn(() => 0) }));
vi.mock('../liabilities/repo', () => ({
  listAllValuationRows: vi.fn(() => [{ entityId: 5, asOfDate: '2026-01-01', value: 150000 }]),
  listLiabilities: vi.fn(() => [{ id: 5, archivedAt: Date.now() }]), // archived today
}));

const { getNetWorthTrend } = await import('./service');

describe('getNetWorthTrend with a liability archived today that had real historical debt', () => {
  it('still shows the true historical debt for months before archival, and excludes it only from today onward', () => {
    const todayIso = new Date().toISOString().slice(0, 10);
    const result = getNetWorthTrend();

    const januaryPoint = result.find((p) => p.date.startsWith('2026-01'));
    const todayPoint = result.find((p) => p.date === todayIso);

    expect(januaryPoint?.liabilitiesTotal).toBe(150000);
    expect(todayPoint?.liabilitiesTotal).toBe(0);
  });
});
