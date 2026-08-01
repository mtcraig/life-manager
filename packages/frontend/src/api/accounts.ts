import type {
  AccountDto,
  AccountMutationResultDto,
  CreateAccountInput,
  IngestStartedDto,
  UpdateAccountInput,
} from '@life-manager/shared';
import { apiFetch } from './client.js';

export function fetchAccounts() {
  return apiFetch<AccountDto[]>('/accounts');
}

export function createAccount(input: CreateAccountInput) {
  return apiFetch<AccountMutationResultDto>('/accounts', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateAccount(id: number, input: UpdateAccountInput) {
  return apiFetch<AccountMutationResultDto>(`/accounts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteAccount(id: number) {
  return apiFetch<void>(`/accounts/${id}`, { method: 'DELETE' });
}

export function ingestAccount(id: number) {
  return apiFetch<IngestStartedDto>(`/accounts/${id}/ingest`, { method: 'POST' });
}
