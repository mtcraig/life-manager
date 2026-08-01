import type {
  BulkImportValuationsResultDto,
  CreateInvestmentInput,
  CreateValuationInput,
  HoldingsMonthRowDto,
  InvestmentDto,
  UpdateValuationInput,
  ValuationDto,
} from '@life-manager/shared';
import { apiFetch } from './client.js';

export function fetchInvestments(includeArchived = false) {
  return apiFetch<InvestmentDto[]>(`/investments?includeArchived=${includeArchived}`);
}

export function createInvestment(input: CreateInvestmentInput) {
  return apiFetch<InvestmentDto>('/investments', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateInvestment(id: number, input: Partial<CreateInvestmentInput>) {
  return apiFetch<InvestmentDto>(`/investments/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function archiveInvestment(id: number) {
  return apiFetch<InvestmentDto>(`/investments/${id}/archive`, { method: 'POST' });
}

export function deleteInvestment(id: number) {
  return apiFetch<void>(`/investments/${id}`, { method: 'DELETE' });
}

export function fetchInvestmentValuations(investmentId: number) {
  return apiFetch<ValuationDto[]>(`/investments/${investmentId}/valuations`);
}

export function addInvestmentValuation(investmentId: number, input: CreateValuationInput) {
  return apiFetch<ValuationDto>(`/investments/${investmentId}/valuations`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateInvestmentValuation(
  investmentId: number,
  valuationId: number,
  input: UpdateValuationInput,
) {
  return apiFetch<ValuationDto>(`/investments/${investmentId}/valuations/${valuationId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteInvestmentValuation(investmentId: number, valuationId: number) {
  return apiFetch<void>(`/investments/${investmentId}/valuations/${valuationId}`, { method: 'DELETE' });
}

export function bulkImportInvestmentValuations(csvContent: string) {
  return apiFetch<BulkImportValuationsResultDto>('/investments/bulk-import-valuations', {
    method: 'POST',
    body: JSON.stringify({ csvContent }),
  });
}

export function fetchHoldingsByMonth() {
  return apiFetch<HoldingsMonthRowDto[]>('/investments/holdings-by-month');
}
