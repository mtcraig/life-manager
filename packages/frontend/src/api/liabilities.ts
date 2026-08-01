import type {
  BulkImportValuationsResultDto,
  CreateLiabilityInput,
  CreateValuationInput,
  LiabilityDto,
  UpdateValuationInput,
  ValuationDto,
} from '@life-manager/shared';
import { apiFetch } from './client.js';

export function fetchLiabilities(includeArchived = false) {
  return apiFetch<LiabilityDto[]>(`/liabilities?includeArchived=${includeArchived}`);
}

export function createLiability(input: CreateLiabilityInput) {
  return apiFetch<LiabilityDto>('/liabilities', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateLiability(id: number, input: Partial<CreateLiabilityInput>) {
  return apiFetch<LiabilityDto>(`/liabilities/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function archiveLiability(id: number) {
  return apiFetch<LiabilityDto>(`/liabilities/${id}/archive`, { method: 'POST' });
}

export function unarchiveLiability(id: number) {
  return apiFetch<LiabilityDto>(`/liabilities/${id}/unarchive`, { method: 'POST' });
}

export function deleteLiability(id: number) {
  return apiFetch<void>(`/liabilities/${id}`, { method: 'DELETE' });
}

export function fetchLiabilityValuations(liabilityId: number) {
  return apiFetch<ValuationDto[]>(`/liabilities/${liabilityId}/valuations`);
}

export function addLiabilityValuation(liabilityId: number, input: CreateValuationInput) {
  return apiFetch<ValuationDto>(`/liabilities/${liabilityId}/valuations`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateLiabilityValuation(
  liabilityId: number,
  valuationId: number,
  input: UpdateValuationInput,
) {
  return apiFetch<ValuationDto>(`/liabilities/${liabilityId}/valuations/${valuationId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteLiabilityValuation(liabilityId: number, valuationId: number) {
  return apiFetch<void>(`/liabilities/${liabilityId}/valuations/${valuationId}`, { method: 'DELETE' });
}

export function bulkImportLiabilityValuations(csvContent: string) {
  return apiFetch<BulkImportValuationsResultDto>('/liabilities/bulk-import-valuations', {
    method: 'POST',
    body: JSON.stringify({ csvContent }),
  });
}
