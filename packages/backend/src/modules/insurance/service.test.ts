import { beforeEach, describe, expect, it } from 'vitest';
import { vi } from 'vitest';
import type { InsurancePlanRow } from './repo';

const plansById = new Map<number, InsurancePlanRow>();
let nextId = 1;

vi.mock('./repo', () => ({
  listInsurancePlans: vi.fn(() => [...plansById.values()]),
  getInsurancePlanById: vi.fn((id: number) => plansById.get(id)),
  insertInsurancePlan: vi.fn((fields: Omit<InsurancePlanRow, 'id' | 'createdAt' | 'updatedAt' | 'cancelledAt'>) => {
    const row: InsurancePlanRow = {
      id: nextId++,
      cancelledAt: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...fields,
    };
    plansById.set(row.id, row);
    return row;
  }),
  updateInsurancePlan: vi.fn((id: number, fields: Partial<InsurancePlanRow>) => {
    const existing = plansById.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...fields, updatedAt: Date.now() };
    plansById.set(id, updated);
    return updated;
  }),
  deleteInsurancePlan: vi.fn((id: number) => plansById.delete(id)),
  cancelInsurancePlan: vi.fn((id: number) => {
    const existing = plansById.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, cancelledAt: Date.now(), updatedAt: Date.now() };
    plansById.set(id, updated);
    return updated;
  }),
}));

const { listInsurancePlans, cancelInsurancePlan } = await import('./service');

function makePlan(overrides: Partial<InsurancePlanRow> & { id: number }): InsurancePlanRow {
  return {
    name: 'Home policy',
    type: 'home',
    coverageAmount: 100000,
    premiumAmount: 1000,
    premiumFrequency: 'monthly',
    effectiveDate: '2020-01-01',
    renewalDate: '2099-01-01',
    provider: null,
    notes: null,
    cancelledAt: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

beforeEach(() => {
  plansById.clear();
  nextId = 1;
});

describe('listInsurancePlans lazy auto-cancel on read', () => {
  it('auto-cancels a plan whose renewal date has passed', () => {
    plansById.set(1, makePlan({ id: 1, renewalDate: '2020-01-01' }));

    const [dto] = listInsurancePlans();

    expect(dto!.cancelledAt).not.toBeNull();
  });

  it('does not touch a plan already cancelled', () => {
    const cancelledAt = Date.now() - 1000;
    plansById.set(1, makePlan({ id: 1, renewalDate: '2020-01-01', cancelledAt }));

    const [dto] = listInsurancePlans();

    expect(new Date(dto!.cancelledAt as string).getTime()).toBe(cancelledAt);
  });

  it('does not touch a plan whose renewal date is in the future', () => {
    plansById.set(1, makePlan({ id: 1, renewalDate: '2099-01-01' }));

    const [dto] = listInsurancePlans();

    expect(dto!.cancelledAt).toBeNull();
  });
});

describe('cancelInsurancePlan', () => {
  it('sets cancelledAt on the plan', () => {
    plansById.set(1, makePlan({ id: 1 }));

    const dto = cancelInsurancePlan(1);

    expect(dto.cancelledAt).not.toBeNull();
  });

  it('throws a 404 for an unknown id', () => {
    expect(() => cancelInsurancePlan(999)).toThrow();
  });
});
