import type {
  CreateInsurancePlanInput,
  InsurancePlanDto,
  UpdateInsurancePlanInput,
} from '@life-manager/shared';
import { apiFetch } from './client.js';

export function fetchInsurancePlans() {
  return apiFetch<InsurancePlanDto[]>('/insurance-plans');
}

export function createInsurancePlan(input: CreateInsurancePlanInput) {
  return apiFetch<InsurancePlanDto>('/insurance-plans', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateInsurancePlan(id: number, input: UpdateInsurancePlanInput) {
  return apiFetch<InsurancePlanDto>(`/insurance-plans/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteInsurancePlan(id: number) {
  return apiFetch<void>(`/insurance-plans/${id}`, { method: 'DELETE' });
}

export function cancelInsurancePlan(id: number) {
  return apiFetch<InsurancePlanDto>(`/insurance-plans/${id}/cancel`, { method: 'POST' });
}
