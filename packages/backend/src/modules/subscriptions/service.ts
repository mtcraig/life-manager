import type {
  CreateSubscriptionInput,
  SubscriptionDto,
  UpdateSubscriptionInput,
} from '@life-manager/shared';
import { HttpError } from '../../lib/httpError';
import * as repo from './repo';
import type { SubscriptionRow } from './repo';

function toDto(row: SubscriptionRow): SubscriptionDto {
  return {
    id: row.id,
    name: row.name,
    provider: row.provider,
    amount: row.amount,
    frequency: row.frequency as SubscriptionDto['frequency'],
    categoryId: row.categoryId,
    startDate: row.startDate,
    nextRenewalDate: row.nextRenewalDate,
    cancelledAt: row.cancelledAt === null ? null : new Date(row.cancelledAt).toISOString(),
    notes: row.notes,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

export function listSubscriptions(): SubscriptionDto[] {
  return repo.listSubscriptions().map(toDto);
}

export function getSubscription(id: number): SubscriptionDto {
  const row = repo.getSubscriptionById(id);
  if (!row) {
    throw new HttpError(404, `Subscription ${id} not found`);
  }
  return toDto(row);
}

export function createSubscription(input: CreateSubscriptionInput): SubscriptionDto {
  const row = repo.insertSubscription({
    name: input.name,
    provider: input.provider ?? null,
    amount: input.amount,
    frequency: input.frequency,
    categoryId: input.categoryId ?? null,
    startDate: input.startDate,
    nextRenewalDate: input.nextRenewalDate,
    notes: input.notes ?? null,
  });
  return toDto(row);
}

export function updateSubscription(id: number, input: UpdateSubscriptionInput): SubscriptionDto {
  if (!repo.getSubscriptionById(id)) {
    throw new HttpError(404, `Subscription ${id} not found`);
  }
  const row = repo.updateSubscription(id, {
    ...(input.name !== undefined && { name: input.name }),
    ...(input.provider !== undefined && { provider: input.provider ?? null }),
    ...(input.amount !== undefined && { amount: input.amount }),
    ...(input.frequency !== undefined && { frequency: input.frequency }),
    ...(input.categoryId !== undefined && { categoryId: input.categoryId ?? null }),
    ...(input.startDate !== undefined && { startDate: input.startDate }),
    ...(input.nextRenewalDate !== undefined && { nextRenewalDate: input.nextRenewalDate }),
    ...(input.notes !== undefined && { notes: input.notes ?? null }),
  });
  return toDto(row as NonNullable<typeof row>);
}

export function deleteSubscription(id: number): void {
  const deleted = repo.deleteSubscription(id);
  if (!deleted) {
    throw new HttpError(404, `Subscription ${id} not found`);
  }
}

export function cancelSubscription(id: number): SubscriptionDto {
  const row = repo.cancelSubscription(id);
  if (!row) {
    throw new HttpError(404, `Subscription ${id} not found`);
  }
  return toDto(row);
}
