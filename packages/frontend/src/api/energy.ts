import type {
  BulkImportEnergyReadingsResultDto,
  CreateEnergyReadingInput,
  EnergyReadingDto,
} from '@life-manager/shared';
import { apiFetch } from './client.js';

export function fetchEnergyReadings() {
  return apiFetch<EnergyReadingDto[]>('/energy-readings');
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
