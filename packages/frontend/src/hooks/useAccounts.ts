import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateAccountInput, UpdateAccountInput } from '@life-manager/shared';
import * as accountsApi from '../api/accounts.js';

const ACCOUNTS_KEY = ['accounts'] as const;

export function useAccounts() {
  return useQuery({
    queryKey: ACCOUNTS_KEY,
    queryFn: () => accountsApi.fetchAccounts(),
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAccountInput) => accountsApi.createAccount(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY }),
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateAccountInput }) =>
      accountsApi.updateAccount(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY }),
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => accountsApi.deleteAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

/** Starts an ingestion job; the caller polls its jobId (useJob) and invalidates
 * ['transactions'] itself once that job completes, since this mutation only
 * covers kicking the job off, not its (asynchronous, progress-tracked) completion. */
export function useIngestAccount() {
  return useMutation({
    mutationFn: (id: number) => accountsApi.ingestAccount(id),
  });
}
