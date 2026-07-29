import type { AreaDto, CreateAreaInput } from '@life-manager/shared';
import { apiFetch } from './client.js';

export function fetchAreas() {
  return apiFetch<AreaDto[]>('/areas');
}

export function createArea(input: CreateAreaInput) {
  return apiFetch<AreaDto>('/areas', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function deleteArea(id: number) {
  return apiFetch<void>(`/areas/${id}`, { method: 'DELETE' });
}
