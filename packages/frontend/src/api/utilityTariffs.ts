import type {
  CreateUtilityTariffInput,
  UpdateUtilityTariffInput,
  UtilityTariffDto,
} from '@life-manager/shared';
import { apiFetch } from './client.js';

export function fetchUtilityTariffs() {
  return apiFetch<UtilityTariffDto[]>('/utility-tariffs');
}

export function createUtilityTariff(input: CreateUtilityTariffInput) {
  return apiFetch<UtilityTariffDto>('/utility-tariffs', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateUtilityTariff(id: number, input: UpdateUtilityTariffInput) {
  return apiFetch<UtilityTariffDto>(`/utility-tariffs/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteUtilityTariff(id: number) {
  return apiFetch<void>(`/utility-tariffs/${id}`, { method: 'DELETE' });
}
