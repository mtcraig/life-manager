import type {
  TransactionDto,
  TransactionListQuery,
  TransactionListResultDto,
  UpdateTransactionCategoryInput,
} from '@life-manager/shared';
import { apiFetch } from './client.js';

export function fetchTransactions(query: Partial<TransactionListQuery>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  return apiFetch<TransactionListResultDto>(`/transactions?${params.toString()}`);
}

export function updateTransactionCategory(id: number, input: UpdateTransactionCategoryInput) {
  return apiFetch<TransactionDto>(`/transactions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
