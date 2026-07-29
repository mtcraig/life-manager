import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateAccountInput, UpdateAccountInput } from '@life-manager/shared';
import * as accountsApi from '../api/accounts.js';

const ACCOUNTS_KEY = ['accounts'] as const;

export function useAccounts(includeArchived = false) {
  return useQuery({
    queryKey: [...ACCOUNTS_KEY, { includeArchived }],
    queryFn: () => accountsApi.fetchAccounts(includeArchived),
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

export function useArchiveAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => accountsApi.archiveAccount(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY }),
  });
}

export function useIngestAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => accountsApi.ingestAccount(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions'] }),
  });
}
