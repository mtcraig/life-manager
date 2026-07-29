import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { TransactionListQuery, UpdateTransactionCategoryInput } from '@life-manager/shared';
import { fetchTransactions, updateTransactionCategory } from '../api/transactions.js';

export function useTransactions(query: Partial<TransactionListQuery>) {
  return useQuery({
    queryKey: ['transactions', query],
    queryFn: () => fetchTransactions(query),
  });
}

export function useUpdateTransactionCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateTransactionCategoryInput }) =>
      updateTransactionCategory(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions'] }),
  });
}
