import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CategorisationRuleRow } from './repo';
import type { TransactionRow } from '../transactions/repo';

let nextRuleId = 1;
const rulesById = new Map<number, CategorisationRuleRow>();
const transactionsById = new Map<number, TransactionRow>();

vi.mock('./repo', () => ({
  listRules: vi.fn(() =>
    [...rulesById.values()].sort(
      (a, b) => b.priority - a.priority || a.id - b.id,
    ),
  ),
  getRuleById: vi.fn((id: number) => rulesById.get(id)),
  insertRule: vi.fn((fields: Omit<CategorisationRuleRow, 'id' | 'createdAt' | 'updatedAt'>) => {
    const row: CategorisationRuleRow = {
      id: nextRuleId++,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...fields,
    };
    rulesById.set(row.id, row);
    return row;
  }),
  updateRule: vi.fn((id: number, fields: Partial<CategorisationRuleRow>) => {
    const existing = rulesById.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...fields, updatedAt: Date.now() };
    rulesById.set(id, updated);
    return updated;
  }),
  deleteRule: vi.fn((id: number) => rulesById.delete(id)),
}));

vi.mock('../categories/repo', () => ({
  getCategoryById: vi.fn((id: number) => ({ id, name: 'Category', isTransfer: false, kind: null, color: null })),
  getCategoryByName: vi.fn(),
  insertCategory: vi.fn(),
}));

vi.mock('../transactions/repo', () => ({
  listUncategorised: vi.fn(() =>
    [...transactionsById.values()].filter((t) => t.categoryId === null),
  ),
  listUncategorisedOrRuleSourced: vi.fn(() =>
    [...transactionsById.values()].filter(
      (t) => t.categoryId === null || t.categorySource === 'rule',
    ),
  ),
  setTransactionCategory: vi.fn(
    (id: number, categoryId: number | null, categorySource: string | null, matchedRuleId: number | null) => {
      const existing = transactionsById.get(id);
      if (!existing) return undefined;
      const updated = { ...existing, categoryId, categorySource, matchedRuleId };
      transactionsById.set(id, updated);
      return updated;
    },
  ),
}));

const { createRule, updateRule, recategoriseUncategorised } = await import('./service');

function makeTransaction(overrides: Partial<TransactionRow> & { id: number }): TransactionRow {
  return {
    accountId: 1,
    date: '2026-01-01',
    amount: -500,
    description: 'Tesco Store 123',
    normalizedDescription: 'tesco store 123',
    categoryId: null,
    categorySource: null,
    matchedRuleId: null,
    balanceAfter: null,
    dedupeHash: `hash-${overrides.id}`,
    rawCsvRow: {},
    importedAt: Date.now(),
    ...overrides,
  };
}

beforeEach(() => {
  rulesById.clear();
  transactionsById.clear();
  nextRuleId = 1;
});

describe('createRule / updateRule auto-apply to existing transactions', () => {
  it('immediately recategorises a previously-uncategorised transaction that now matches', () => {
    transactionsById.set(1, makeTransaction({ id: 1, normalizedDescription: 'tesco store 123' }));

    createRule({ pattern: 'tesco', categoryId: 10, matchType: 'exact', priority: 0 });

    const txn = transactionsById.get(1)!;
    expect(txn.categoryId).toBe(10);
    expect(txn.categorySource).toBe('rule');
  });

  it('never overwrites a manually-set category even if a new rule would match', () => {
    transactionsById.set(
      1,
      makeTransaction({
        id: 1,
        normalizedDescription: 'tesco store 123',
        categoryId: 99,
        categorySource: 'manual',
      }),
    );

    createRule({ pattern: 'tesco', categoryId: 10, matchType: 'exact', priority: 0 });

    const txn = transactionsById.get(1)!;
    expect(txn.categoryId).toBe(99);
    expect(txn.categorySource).toBe('manual');
  });

  it('re-evaluates rule-sourced transactions when a rule pattern is edited, including losing a match', () => {
    const rule = createRule({ pattern: 'tesco', categoryId: 10, matchType: 'exact', priority: 0 });
    transactionsById.set(1, makeTransaction({ id: 1, normalizedDescription: 'tesco store 123' }));
    // Re-apply as if the transaction existed at creation time (createRule already ran once above
    // with no matching transactions present yet, so seed the matched state explicitly here).
    transactionsById.set(
      1,
      makeTransaction({
        id: 1,
        normalizedDescription: 'tesco store 123',
        categoryId: 10,
        categorySource: 'rule',
        matchedRuleId: rule.id,
      }),
    );

    updateRule(rule.id, { pattern: 'sainsburys' });

    const txn = transactionsById.get(1)!;
    expect(txn.categoryId).toBeNull();
    expect(txn.categorySource).toBeNull();
  });

  it('recategoriseUncategorised only targets transactions with no category', () => {
    createRule({ pattern: 'tesco', categoryId: 10, matchType: 'exact', priority: 0 });
    transactionsById.set(1, makeTransaction({ id: 1, normalizedDescription: 'tesco store 123' }));
    transactionsById.set(
      2,
      makeTransaction({
        id: 2,
        normalizedDescription: 'tesco store 456',
        categoryId: 99,
        categorySource: 'manual',
      }),
    );

    const result = recategoriseUncategorised();

    expect(result.updated).toBe(1);
    expect(transactionsById.get(1)!.categoryId).toBe(10);
    expect(transactionsById.get(2)!.categoryId).toBe(99);
  });
});
