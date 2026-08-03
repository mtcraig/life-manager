import { beforeEach, describe, expect, it } from 'vitest';
import { vi } from 'vitest';
import type { BudgetRow } from './repo';

const budgetsById = new Map<number, BudgetRow>();
let nextId = 1;

vi.mock('./repo', () => ({
  listBudgets: vi.fn(() => [...budgetsById.values()]),
  getBudgetById: vi.fn((id: number) => budgetsById.get(id)),
  listBudgetsActiveDuring: vi.fn((periodStart: string, periodEnd: string) =>
    [...budgetsById.values()].filter(
      (b) => b.startDate <= periodEnd && (b.endDate === null || b.endDate >= periodStart),
    ),
  ),
  insertBudget: vi.fn((fields: Omit<BudgetRow, 'id' | 'createdAt' | 'updatedAt'>) => {
    const row: BudgetRow = { id: nextId++, createdAt: Date.now(), updatedAt: Date.now(), ...fields };
    budgetsById.set(row.id, row);
    return row;
  }),
  updateBudget: vi.fn((id: number, fields: Partial<BudgetRow>) => {
    const existing = budgetsById.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...fields, updatedAt: Date.now() };
    budgetsById.set(id, updated);
    return updated;
  }),
  deleteBudget: vi.fn((id: number) => budgetsById.delete(id)),
}));

vi.mock('../categories/repo', () => ({
  listCategories: vi.fn(() => [
    { id: 1, name: 'Groceries', isTransfer: false, kind: null, color: null, createdAt: 0, updatedAt: 0 },
  ]),
}));

vi.mock('../transactions/repo', () => ({
  listCategorisedTransactionAmountsWithTransferFlag: vi.fn(() => [
    { categoryId: 1, amount: -32000, isTransfer: false },
  ]),
}));

const { createBudget, deleteBudget, getBudget, getBudgetProgress } = await import('./service');

function makeBudget(overrides: Partial<BudgetRow> & { id: number }): BudgetRow {
  return {
    categoryId: 1,
    amount: 40000,
    startDate: '2026-01-01',
    endDate: null,
    notes: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

beforeEach(() => {
  budgetsById.clear();
  nextId = 1;
});

describe('createBudget / getBudget / deleteBudget', () => {
  it('round-trips a budget', () => {
    const created = createBudget({ categoryId: 1, amount: 40000, startDate: '2026-01-01' });
    expect(getBudget(created.id)).toEqual(created);
  });

  it('throws a 404 for an unknown id', () => {
    expect(() => getBudget(999)).toThrow();
  });

  it('throws a 404 deleting an unknown id', () => {
    expect(() => deleteBudget(999)).toThrow();
  });
});

describe('getBudgetProgress', () => {
  it('joins the active budget against actual spend for the month containing the given date', () => {
    budgetsById.set(1, makeBudget({ id: 1 }));

    const progress = getBudgetProgress('2026-08-15');

    expect(progress.periodStart).toBe('2026-08-01');
    expect(progress.periodEnd).toBe('2026-08-31');
    expect(progress.items).toEqual([
      { categoryId: 1, categoryName: 'Groceries', budgeted: 40000, actual: 32000, delta: 8000 },
    ]);
    expect(progress.totalBudgeted).toBe(40000);
    expect(progress.totalActual).toBe(32000);
  });

  it('defaults to the current month when no date is given', () => {
    budgetsById.set(1, makeBudget({ id: 1, startDate: '2020-01-01' }));

    const progress = getBudgetProgress();

    const today = new Date().toISOString().slice(0, 10);
    expect(progress.periodStart.slice(0, 7)).toBe(today.slice(0, 7));
  });

  it('excludes a budget whose date range does not cover the period', () => {
    budgetsById.set(1, makeBudget({ id: 1, startDate: '2027-01-01', endDate: null }));

    const progress = getBudgetProgress('2026-08-15');

    expect(progress.items).toEqual([]);
  });
});
