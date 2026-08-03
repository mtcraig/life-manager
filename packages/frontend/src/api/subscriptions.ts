import type {
  CreateSubscriptionInput,
  SubscriptionDto,
  UpdateSubscriptionInput,
} from '@life-manager/shared';
import { apiFetch } from './client.js';

export function fetchSubscriptions() {
  return apiFetch<SubscriptionDto[]>('/subscriptions');
}

export function createSubscription(input: CreateSubscriptionInput) {
  return apiFetch<SubscriptionDto>('/subscriptions', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateSubscription(id: number, input: UpdateSubscriptionInput) {
  return apiFetch<SubscriptionDto>(`/subscriptions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteSubscription(id: number) {
  return apiFetch<void>(`/subscriptions/${id}`, { method: 'DELETE' });
}

export function cancelSubscription(id: number) {
  return apiFetch<SubscriptionDto>(`/subscriptions/${id}/cancel`, { method: 'POST' });
}
