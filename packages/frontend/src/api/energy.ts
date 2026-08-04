import type {
  BulkImportEnergyReadingsResultDto,
  CreateEnergyReadingInput,
  EnergyReadingDto,
  UtilityCostSeriesDto,
} from '@life-manager/shared';
import { apiFetch } from './client.js';

function toParams(query: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  return params.toString();
}

export function fetchEnergyReadings() {
  return apiFetch<EnergyReadingDto[]>('/energy-readings');
}

export function fetchUtilityCostSeries(query: { year?: number }) {
  return apiFetch<UtilityCostSeriesDto>(`/energy-utility-costs?${toParams(query)}`);
}

export function createEnergyReading(input: CreateEnergyReadingInput) {
  return apiFetch<EnergyReadingDto>('/energy-readings', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function bulkImportEnergyReadings(csvContent: string) {
  return apiFetch<BulkImportEnergyReadingsResultDto>('/energy-readings/bulk-import', {
    method: 'POST',
    body: JSON.stringify({ csvContent }),
  });
}

export function deleteEnergyReading(id: number) {
  return apiFetch<void>(`/energy-readings/${id}`, { method: 'DELETE' });
}
