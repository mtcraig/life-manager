import type { CategoryDto, CreateCategoryInput } from '@life-manager/shared';
import { apiFetch } from './client.js';

export function fetchCategories() {
  return apiFetch<CategoryDto[]>('/categories');
}

export function createCategory(input: CreateCategoryInput) {
  return apiFetch<CategoryDto>('/categories', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
