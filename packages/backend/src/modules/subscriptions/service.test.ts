import { beforeEach, describe, expect, it } from 'vitest';
import { vi } from 'vitest';
import type { SubscriptionRow } from './repo';

const subscriptionsById = new Map<number, SubscriptionRow>();
let nextId = 1;

vi.mock('./repo', () => ({
  listSubscriptions: vi.fn(() => [...subscriptionsById.values()]),
  getSubscriptionById: vi.fn((id: number) => subscriptionsById.get(id)),
  insertSubscription: vi.fn((fields: Omit<SubscriptionRow, 'id' | 'createdAt' | 'updatedAt' | 'cancelledAt'>) => {
    const row: SubscriptionRow = {
      id: nextId++,
      cancelledAt: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...fields,
    };
    subscriptionsById.set(row.id, row);
    return row;
  }),
  updateSubscription: vi.fn((id: number, fields: Partial<SubscriptionRow>) => {
    const existing = subscriptionsById.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...fields, updatedAt: Date.now() };
    subscriptionsById.set(id, updated);
    return updated;
  }),
  deleteSubscription: vi.fn((id: number) => subscriptionsById.delete(id)),
  cancelSubscription: vi.fn((id: number) => {
    const existing = subscriptionsById.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, cancelledAt: Date.now(), updatedAt: Date.now() };
    subscriptionsById.set(id, updated);
    return updated;
  }),
}));

const { cancelSubscription, createSubscription, deleteSubscription, getSubscription, listSubscriptions } =
  await import('./service');

function makeSubscription(overrides: Partial<SubscriptionRow> & { id: number }): SubscriptionRow {
  return {
    name: 'Netflix',
    provider: null,
    amount: 1599,
    frequency: 'monthly',
    categoryId: null,
    startDate: '2020-01-01',
    nextRenewalDate: '2099-01-01',
    cancelledAt: null,
    notes: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

beforeEach(() => {
  subscriptionsById.clear();
  nextId = 1;
});

describe('createSubscription / getSubscription / deleteSubscription', () => {
  it('round-trips a subscription', () => {
    const created = createSubscription({
      name: 'Spotify',
      amount: 1199,
      frequency: 'monthly',
      startDate: '2026-01-01',
      nextRenewalDate: '2026-09-01',
    });
    expect(getSubscription(created.id)).toEqual(created);
  });

  it('throws a 404 for an unknown id', () => {
    expect(() => getSubscription(999)).toThrow();
  });

  it('throws a 404 deleting an unknown id', () => {
    expect(() => deleteSubscription(999)).toThrow();
  });
});

describe('listSubscriptions', () => {
  it('does not auto-cancel a subscription past its renewal date — it renews indefinitely until cancelled', () => {
    subscriptionsById.set(1, makeSubscription({ id: 1, nextRenewalDate: '2020-01-01' }));

    const [dto] = listSubscriptions();

    expect(dto!.cancelledAt).toBeNull();
  });
});

describe('cancelSubscription', () => {
  it('sets cancelledAt', () => {
    subscriptionsById.set(1, makeSubscription({ id: 1 }));

    const dto = cancelSubscription(1);

    expect(dto.cancelledAt).not.toBeNull();
  });

  it('throws a 404 for an unknown id', () => {
    expect(() => cancelSubscription(999)).toThrow();
  });
});
