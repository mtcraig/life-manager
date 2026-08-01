import { describe, expect, it, vi } from 'vitest';
import type { ExportTransactionRow } from './repo';

const exportRows: ExportTransactionRow[] = [
  {
    date: '2026-01-15',
    accountName: 'Current Account',
    description: 'TESCO STORES',
    categoryName: 'Groceries',
    vendorName: 'Tesco',
    amount: -2599,
  },
  {
    date: '2026-01-10',
    accountName: 'Current Account',
    description: 'SALARY, JAN',
    categoryName: null,
    vendorName: null,
    amount: 250000,
  },
];

vi.mock('./repo', () => ({
  listAllTransactionsForExport: vi.fn(() => exportRows),
}));

const { exportTransactionsCsv } = await import('./service');

describe('exportTransactionsCsv', () => {
  it('builds a CSV with a header row and one row per transaction', () => {
    const csv = exportTransactionsCsv({});
    const lines = csv.split('\r\n').filter(Boolean);

    expect(lines[0]).toBe('Date,Account,Description,Category,Vendor,Amount');
    expect(lines[1]).toBe('2026-01-15,Current Account,TESCO STORES,Groceries,Tesco,-25.99');
  });

  it('falls back to "Uncategorised" and quotes a description containing a comma', () => {
    const csv = exportTransactionsCsv({});
    const lines = csv.split('\r\n').filter(Boolean);

    expect(lines[2]).toBe('2026-01-10,Current Account,"SALARY, JAN",Uncategorised,,2500.00');
  });
});
