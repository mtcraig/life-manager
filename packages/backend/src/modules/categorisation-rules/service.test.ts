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

let nextCategoryId = 1000;
const categoriesByName = new Map<string, { id: number; name: string; isTransfer: boolean; kind: null; color: null }>();

vi.mock('../categories/repo', () => ({
  getCategoryById: vi.fn((id: number) => ({ id, name: 'Category', isTransfer: false, kind: null, color: null })),
  getCategoryByName: vi.fn((name: string) => categoriesByName.get(name)),
  insertCategory: vi.fn((fields: { name: string; isTransfer: boolean; kind: null; color: null }) => {
    const row = { id: nextCategoryId++, ...fields };
    categoriesByName.set(fields.name, row);
    return row;
  }),
}));

let nextVendorId = 2000;
const vendorsByName = new Map<string, { id: number; name: string; createdAt: number; updatedAt: number }>();

vi.mock('../vendors/repo', () => ({
  getVendorById: vi.fn((id: number) => ({ id, name: 'Vendor', createdAt: Date.now(), updatedAt: Date.now() })),
  getVendorByName: vi.fn((name: string) => vendorsByName.get(name)),
  insertVendor: vi.fn((fields: { name: string }) => {
    const row = { id: nextVendorId++, name: fields.name, createdAt: Date.now(), updatedAt: Date.now() };
    vendorsByName.set(fields.name, row);
    return row;
  }),
}));

vi.mock('../transactions/repo', () => ({
  listUncategorised: vi.fn(() =>
    [...transactionsById.values()].filter((t) => t.categoryId === null),
  ),
  listUncategorisedOrRuleSourced: vi.fn(() =>
    [...transactionsById.values()].filter(
      (t) =>
        t.categoryId === null ||
        t.categorySource === 'rule' ||
        t.vendorId === null ||
        t.vendorSource === 'rule',
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
  clearMatchedRuleId: vi.fn((ruleId: number) => {
    for (const [id, txn] of transactionsById.entries()) {
      if (txn.matchedRuleId === ruleId) {
        transactionsById.set(id, { ...txn, matchedRuleId: null });
      }
    }
  }),
  setTransactionCategoryAndVendor: vi.fn(
    (
      id: number,
      fields: {
        categoryId: number | null;
        categorySource: string | null;
        matchedRuleId: number | null;
        vendorId: number | null;
        vendorSource: string | null;
      },
    ) => {
      const existing = transactionsById.get(id);
      if (!existing) return undefined;
      const updated = { ...existing, ...fields };
      transactionsById.set(id, updated);
      return updated;
    },
  ),
}));

const { createRule, updateRule, deleteRule, recategoriseUncategorised, bulkImportRules } = await import('./service');

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
    vendorId: null,
    vendorSource: null,
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
  categoriesByName.clear();
  vendorsByName.clear();
  nextRuleId = 1;
});

describe('createRule / updateRule auto-apply to existing transactions', () => {
  it('immediately recategorises a previously-uncategorised transaction that now matches', () => {
    transactionsById.set(1, makeTransaction({ id: 1, normalizedDescription: 'tesco store 123' }));

    createRule({ pattern: 'tesco', categoryId: 10, vendorId: 5, matchType: 'exact', priority: 0 });

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

    createRule({ pattern: 'tesco', categoryId: 10, vendorId: 5, matchType: 'exact', priority: 0 });

    const txn = transactionsById.get(1)!;
    expect(txn.categoryId).toBe(99);
    expect(txn.categorySource).toBe('manual');
  });

  it('re-evaluates rule-sourced transactions when a rule pattern is edited, including losing a match', () => {
    const rule = createRule({ pattern: 'tesco', categoryId: 10, vendorId: 5, matchType: 'exact', priority: 0 });
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
    createRule({ pattern: 'tesco', categoryId: 10, vendorId: 5, matchType: 'exact', priority: 0 });
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

describe('createRule / updateRule vendor auto-apply (mirrors category behaviour)', () => {
  it('immediately sets vendor on a previously-vendor-unset transaction that now matches', () => {
    transactionsById.set(1, makeTransaction({ id: 1, normalizedDescription: 'tesco store 123' }));

    createRule({ pattern: 'tesco', categoryId: 10, vendorId: 5, matchType: 'exact', priority: 0 });

    const txn = transactionsById.get(1)!;
    expect(txn.vendorId).toBe(5);
    expect(txn.vendorSource).toBe('rule');
  });

  it('never overwrites a manually-set vendor even if a new rule would match', () => {
    transactionsById.set(
      1,
      makeTransaction({
        id: 1,
        normalizedDescription: 'tesco store 123',
        vendorId: 99,
        vendorSource: 'manual',
      }),
    );

    createRule({ pattern: 'tesco', categoryId: 10, vendorId: 5, matchType: 'exact', priority: 0 });

    const txn = transactionsById.get(1)!;
    expect(txn.vendorId).toBe(99);
    expect(txn.vendorSource).toBe('manual');
  });

  it('re-evaluates rule-sourced vendor when a rule pattern is edited, including losing a match', () => {
    const rule = createRule({ pattern: 'tesco', categoryId: 10, vendorId: 5, matchType: 'exact', priority: 0 });
    transactionsById.set(
      1,
      makeTransaction({
        id: 1,
        normalizedDescription: 'tesco store 123',
        categoryId: 10,
        categorySource: 'rule',
        matchedRuleId: rule.id,
        vendorId: 5,
        vendorSource: 'rule',
      }),
    );

    updateRule(rule.id, { pattern: 'sainsburys' });

    const txn = transactionsById.get(1)!;
    expect(txn.vendorId).toBeNull();
    expect(txn.vendorSource).toBeNull();
  });

  it('tracks category and vendor independently: a manual category does not block a rule-sourced vendor update', () => {
    transactionsById.set(
      1,
      makeTransaction({
        id: 1,
        normalizedDescription: 'tesco store 123',
        categoryId: 99,
        categorySource: 'manual',
      }),
    );

    createRule({ pattern: 'tesco', categoryId: 10, vendorId: 5, matchType: 'exact', priority: 0 });

    const txn = transactionsById.get(1)!;
    expect(txn.categoryId).toBe(99);
    expect(txn.categorySource).toBe('manual');
    expect(txn.vendorId).toBe(5);
    expect(txn.vendorSource).toBe('rule');
  });
});

describe('deleteRule', () => {
  it('clears matchedRuleId on transactions that pointed at the deleted rule, leaving category/vendor intact', () => {
    const rule = createRule({ pattern: 'tesco', categoryId: 10, vendorId: 5, matchType: 'exact', priority: 0 });
    transactionsById.set(
      1,
      makeTransaction({
        id: 1,
        normalizedDescription: 'tesco store 123',
        categoryId: 10,
        categorySource: 'rule',
        matchedRuleId: rule.id,
        vendorId: 5,
        vendorSource: 'rule',
      }),
    );

    deleteRule(rule.id);

    const txn = transactionsById.get(1)!;
    expect(txn.matchedRuleId).toBeNull();
    expect(txn.categoryId).toBe(10);
    expect(txn.vendorId).toBe(5);
    expect(rulesById.has(rule.id)).toBe(false);
  });
});

describe('bulkImportRules', () => {
  const columnMapping = { pattern: 'Pattern', category: 'Category', vendor: 'Vendor' };

  it('creates a rule with a category and vendor resolved by name, creating both if new', () => {
    const result = bulkImportRules({
      csvContent: 'Pattern,Category,Vendor\ntesco,Groceries,Tesco\n',
      columnMapping,
    });

    expect(result).toEqual({ rulesCreated: 1, categoriesCreated: 1, vendorsCreated: 1 });
    const rule = [...rulesById.values()][0]!;
    expect(rule.pattern).toBe('tesco');
    expect(categoriesByName.get('Groceries')!.id).toBe(rule.categoryId);
    expect(vendorsByName.get('Tesco')!.id).toBe(rule.vendorId);
  });

  it('reuses an existing category and vendor by name instead of creating duplicates', () => {
    bulkImportRules({ csvContent: 'Pattern,Category,Vendor\ntesco,Groceries,Tesco\n', columnMapping });
    const result = bulkImportRules({
      csvContent: 'Pattern,Category,Vendor\ntesco express,Groceries,Tesco\n',
      columnMapping,
    });

    expect(result).toEqual({ rulesCreated: 1, categoriesCreated: 0, vendorsCreated: 0 });
    expect(rulesById.size).toBe(2);
  });

  it('skips a row missing the vendor column value', () => {
    const result = bulkImportRules({
      csvContent: 'Pattern,Category,Vendor\ntesco,Groceries,\n',
      columnMapping,
    });

    expect(result).toEqual({ rulesCreated: 0, categoriesCreated: 0, vendorsCreated: 0 });
    expect(rulesById.size).toBe(0);
  });
});
