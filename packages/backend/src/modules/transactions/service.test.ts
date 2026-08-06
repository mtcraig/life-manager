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

const listTransactionsResult = { items: [], total: 0 };

vi.mock('./repo', () => ({
  listAllTransactionsForExport: vi.fn(() => exportRows),
  listTransactions: vi.fn(() => listTransactionsResult),
}));

const repo = await import('./repo');
const { exportTransactionsCsv, listTransactions } = await import('./service');

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

describe('listTransactions', () => {
  it('passes the description filter through to the repo unchanged', () => {
    const query = { description: 'tesco', page: 1, pageSize: 100 };
    listTransactions(query);

    expect(repo.listTransactions).toHaveBeenCalledWith(query);
  });
});
