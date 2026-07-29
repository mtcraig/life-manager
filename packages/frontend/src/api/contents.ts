import type {
  ContentsItemDto,
  CreateContentsItemInput,
  UpdateContentsItemInput,
} from '@life-manager/shared';
import { apiFetch } from './client.js';

export function fetchContentsItems() {
  return apiFetch<ContentsItemDto[]>('/contents-items');
}

export function createContentsItem(input: CreateContentsItemInput) {
  return apiFetch<ContentsItemDto>('/contents-items', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateContentsItem(id: number, input: UpdateContentsItemInput) {
  return apiFetch<ContentsItemDto>(`/contents-items/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteContentsItem(id: number) {
  return apiFetch<void>(`/contents-items/${id}`, { method: 'DELETE' });
}
