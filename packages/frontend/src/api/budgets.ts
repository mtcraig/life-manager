import type { BudgetDto, BudgetProgressDto, CreateBudgetInput, UpdateBudgetInput } from '@life-manager/shared';
import { apiFetch } from './client.js';

export function fetchBudgets() {
  return apiFetch<BudgetDto[]>('/budgets');
}

export function fetchBudgetProgress(date?: string) {
  const query = date ? `?date=${encodeURIComponent(date)}` : '';
  return apiFetch<BudgetProgressDto>(`/budgets/progress${query}`);
}

export function fetchAnnualBudgetProgress(year?: number) {
  const query = year ? `?year=${year}` : '';
  return apiFetch<BudgetProgressDto>(`/budgets/progress/annual${query}`);
}

export function createBudget(input: CreateBudgetInput) {
  return apiFetch<BudgetDto>('/budgets', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateBudget(id: number, input: UpdateBudgetInput) {
  return apiFetch<BudgetDto>(`/budgets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteBudget(id: number) {
  return apiFetch<void>(`/budgets/${id}`, { method: 'DELETE' });
}
