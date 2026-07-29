import type {
  BulkImportRulesInput,
  BulkImportRulesResultDto,
  CategorisationRuleDto,
  CreateCategorisationRuleInput,
  UpdateCategorisationRuleInput,
} from '@life-manager/shared';
import { apiFetch } from './client.js';

export function fetchCategorisationRules() {
  return apiFetch<CategorisationRuleDto[]>('/categorisation-rules');
}

export function createCategorisationRule(input: CreateCategorisationRuleInput) {
  return apiFetch<CategorisationRuleDto>('/categorisation-rules', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateCategorisationRule(id: number, input: UpdateCategorisationRuleInput) {
  return apiFetch<CategorisationRuleDto>(`/categorisation-rules/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteCategorisationRule(id: number) {
  return apiFetch<void>(`/categorisation-rules/${id}`, { method: 'DELETE' });
}

export function bulkImportCategorisationRules(input: BulkImportRulesInput) {
  return apiFetch<BulkImportRulesResultDto>('/categorisation-rules/bulk-import', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function recategoriseUncategorised() {
  return apiFetch<{ updated: number }>('/categorisation-rules/recategorise', { method: 'POST' });
}
