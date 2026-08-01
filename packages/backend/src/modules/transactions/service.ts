import type {
  TransactionDto,
  TransactionExportQuery,
  TransactionListQuery,
  TransactionListResultDto,
  UpdateTransactionCategoryInput,
} from '@life-manager/shared';
import { HttpError } from '../../lib/httpError';
import { toCsvRow } from '../../lib/csv';
import * as repo from './repo';
import type { TransactionRow } from './repo';

function toDto(row: TransactionRow): TransactionDto {
  return {
    id: row.id,
    accountId: row.accountId,
    date: row.date,
    amount: row.amount,
    description: row.description,
    normalizedDescription: row.normalizedDescription,
    categoryId: row.categoryId,
    categorySource: row.categorySource as TransactionDto['categorySource'],
    matchedRuleId: row.matchedRuleId,
    vendorId: row.vendorId,
    vendorSource: row.vendorSource as TransactionDto['vendorSource'],
    balanceAfter: row.balanceAfter,
    importedAt: new Date(row.importedAt).toISOString(),
  };
}

export function listTransactions(query: TransactionListQuery): TransactionListResultDto {
  const { items, total } = repo.listTransactions(query);
  return {
    items: items.map(toDto),
    total,
    page: query.page,
    pageSize: query.pageSize,
  };
}

/** CSV of every transaction matching the given filters (not just the current page), for the Detail page's Export button. */
export function exportTransactionsCsv(query: TransactionExportQuery): string {
  const rows = repo.listAllTransactionsForExport(query);
  let csv = toCsvRow(['Date', 'Account', 'Description', 'Category', 'Vendor', 'Amount']);
  for (const row of rows) {
    csv += toCsvRow([
      row.date,
      row.accountName,
      row.description,
      row.categoryName ?? 'Uncategorised',
      row.vendorName,
      (row.amount / 100).toFixed(2),
    ]);
  }
  return csv;
}

export function updateTransactionCategory(
  id: number,
  input: UpdateTransactionCategoryInput,
): TransactionDto {
  const row = repo.setTransactionCategory(
    id,
    input.categoryId,
    input.categoryId === null ? null : 'manual',
    input.categoryId === null ? null : null,
  );
  if (!row) {
    throw new HttpError(404, `Transaction ${id} not found`);
  }
  return toDto(row);
}
