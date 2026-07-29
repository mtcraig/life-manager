import type {
  AccountDto,
  CreateAccountInput,
  IngestResultDto,
  UpdateAccountInput,
} from '@life-manager/shared';
import { apiFetch } from './client.js';

export function fetchAccounts(includeArchived = false) {
  return apiFetch<AccountDto[]>(`/accounts?includeArchived=${includeArchived}`);
}

export function createAccount(input: CreateAccountInput) {
  return apiFetch<AccountDto>('/accounts', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateAccount(id: number, input: UpdateAccountInput) {
  return apiFetch<AccountDto>(`/accounts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function archiveAccount(id: number) {
  return apiFetch<AccountDto>(`/accounts/${id}/archive`, { method: 'POST' });
}

export function ingestAccount(id: number) {
  return apiFetch<IngestResultDto[]>(`/accounts/${id}/ingest`, { method: 'POST' });
}
