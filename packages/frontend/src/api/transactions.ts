import type {
  TransactionDto,
  TransactionExportQuery,
  TransactionListQuery,
  TransactionListResultDto,
  UpdateTransactionCategoryInput,
} from '@life-manager/shared';
import { apiFetch } from './client.js';

function toQueryString(query: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  return params.toString();
}

export function fetchTransactions(query: Partial<TransactionListQuery>) {
  return apiFetch<TransactionListResultDto>(`/transactions?${toQueryString(query)}`);
}

/** A plain link URL — like the database backup download, the browser handles
 * the download from the response's Content-Disposition header, no fetch/blob needed. */
export function transactionExportUrl(query: Partial<TransactionExportQuery>): string {
  return `/api/transactions/export?${toQueryString(query)}`;
}

export function updateTransactionCategory(id: number, input: UpdateTransactionCategoryInput) {
  return apiFetch<TransactionDto>(`/transactions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
