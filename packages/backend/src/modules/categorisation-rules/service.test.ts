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
  deleteAllRules: vi.fn(() => rulesById.clear()),
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
  listByMatchedRuleId: vi.fn((ruleId: number) =>
    [...transactionsById.values()].filter((t) => t.matchedRuleId === ruleId),
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
  clearAllMatchedRuleIds: vi.fn(() => {
    for (const [id, txn] of transactionsById.entries()) {
      if (txn.matchedRuleId !== null) {
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

interface JobRow {
  id: number;
  kind: string;
  status: string;
  total: number;
  processed: number;
  resultJson: string | null;
  errorMessage: string | null;
}

let nextJobId = 1;
const jobsById = new Map<number, JobRow>();

vi.mock('../jobs/repo', () => ({
  createJob: vi.fn((kind: string, total: number) => {
    const job: JobRow = { id: nextJobId++, kind, status: 'running', total, processed: 0, resultJson: null, errorMessage: null };
    jobsById.set(job.id, job);
    return job;
  }),
  updateProgress: vi.fn((id: number, processed: number) => {
    const job = jobsById.get(id);
    if (job) job.processed = processed;
  }),
  completeJob: vi.fn((id: number, resultJson: string) => {
    const job = jobsById.get(id);
    if (job) {
      job.status = 'completed';
      job.resultJson = resultJson;
    }
  }),
  failJob: vi.fn((id: number, errorMessage: string) => {
    const job = jobsById.get(id);
    if (job) {
      job.status = 'failed';
      job.errorMessage = errorMessage;
    }
  }),
  getJobById: vi.fn((id: number) => jobsById.get(id)),
}));

const {
  createRule,
  updateRule,
  deleteRule,
  deleteAllRules,
  recategoriseUncategorised,
  reapplyAllRules,
  bulkImportRules,
} = await import('./service');

/**
 * The recategorise job always yields the event loop once before doing any
 * work (see runRecategoriseJob's leading `await` in service.ts — needed so
 * the *first* chunk doesn't run inline within createRule/updateRule's own
 * call stack, which would delay their HTTP response). That means even a
 * tiny test dataset well under YIELD_EVERY (25) still finishes one tick
 * later, not synchronously — tests that check transaction state after
 * triggering a job must await this first.
 */
async function flushJob(): Promise<void> {
  await new Promise((resolve) => setImmediate(resolve));
}

function jobResult(jobId: number): { updated: number } {
  const job = jobsById.get(jobId);
  return JSON.parse(job?.resultJson ?? '{"updated":0}');
}

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
  jobsById.clear();
  nextRuleId = 1;
  nextJobId = 1;
});

describe('createRule / updateRule auto-apply to existing transactions', () => {
  it('immediately recategorises a previously-uncategorised transaction that now matches', async () => {
    transactionsById.set(1, makeTransaction({ id: 1, normalizedDescription: 'tesco store 123' }));

    createRule({ pattern: 'tesco', categoryId: 10, vendorId: 5, matchType: 'exact', priority: 0 });
    await flushJob();

    const txn = transactionsById.get(1)!;
    expect(txn.categoryId).toBe(10);
    expect(txn.categorySource).toBe('rule');
  });

  it('returns the created rule alongside a recategorise jobId', async () => {
    const result = createRule({ pattern: 'tesco', categoryId: 10, vendorId: 5, matchType: 'exact', priority: 0 });
    await flushJob();

    expect(result.rule.pattern).toBe('tesco');
    expect(typeof result.jobId).toBe('number');
    expect(jobsById.get(result.jobId)?.status).toBe('completed');
  });

  it('never overwrites a manually-set category even if a new rule would match', async () => {
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
    await flushJob();

    const txn = transactionsById.get(1)!;
    expect(txn.categoryId).toBe(99);
    expect(txn.categorySource).toBe('manual');
  });

  it("updateRule's reapply-on-edit clears a transaction previously matched by that rule once the new pattern no longer matches it", async () => {
    const { rule } = createRule({ pattern: 'tesco', categoryId: 10, vendorId: 5, matchType: 'exact', priority: 0 });
    await flushJob();
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
    await flushJob();

    const txn = transactionsById.get(1)!;
    expect(txn.categoryId).toBeNull();
    expect(txn.categorySource).toBeNull();
  });

  it('recategoriseUncategorised only targets transactions with no category', async () => {
    createRule({ pattern: 'tesco', categoryId: 10, vendorId: 5, matchType: 'exact', priority: 0 });
    await flushJob();
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

    const { jobId } = recategoriseUncategorised();
    await flushJob();

    expect(jobResult(jobId).updated).toBe(1);
    expect(transactionsById.get(1)!.categoryId).toBe(10);
    expect(transactionsById.get(2)!.categoryId).toBe(99);
  });
});

describe('createRule / updateRule vendor auto-apply (mirrors category behaviour)', () => {
  it('immediately sets vendor on a previously-vendor-unset transaction that now matches', async () => {
    transactionsById.set(1, makeTransaction({ id: 1, normalizedDescription: 'tesco store 123' }));

    createRule({ pattern: 'tesco', categoryId: 10, vendorId: 5, matchType: 'exact', priority: 0 });
    await flushJob();

    const txn = transactionsById.get(1)!;
    expect(txn.vendorId).toBe(5);
    expect(txn.vendorSource).toBe('rule');
  });

  it('never overwrites a manually-set vendor even if a new rule would match', async () => {
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
    await flushJob();

    const txn = transactionsById.get(1)!;
    expect(txn.vendorId).toBe(99);
    expect(txn.vendorSource).toBe('manual');
  });

  it("updateRule's reapply-on-edit clears a vendor that was rule-sourced from the edited rule once its new pattern no longer matches", async () => {
    const { rule } = createRule({ pattern: 'tesco', categoryId: 10, vendorId: 5, matchType: 'exact', priority: 0 });
    await flushJob();
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
    await flushJob();

    const txn = transactionsById.get(1)!;
    expect(txn.vendorId).toBeNull();
    expect(txn.vendorSource).toBeNull();
  });

  it("does not auto-apply a vendor via the fast path when the transaction already has a category (even a manually-set one) — that needs reapplyAllRules", async () => {
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
    await flushJob();

    // Fast path only looks at Uncategorised transactions, so this one — already
    // categorised, even manually — isn't touched at all, vendor included.
    const txn = transactionsById.get(1)!;
    expect(txn.categoryId).toBe(99);
    expect(txn.categorySource).toBe('manual');
    expect(txn.vendorId).toBeNull();
    expect(txn.vendorSource).toBeNull();
  });
});

describe('reapplyAllRules', () => {
  it('re-evaluates a transaction matched by one rule when a *different* rule is edited to now win the match, catching what the per-rule reapply-on-edit misses', async () => {
    const { rule: ruleA } = createRule({
      pattern: 'tesco',
      categoryId: 10,
      vendorId: 5,
      matchType: 'exact',
      priority: 0,
    });
    await flushJob();
    transactionsById.set(
      1,
      makeTransaction({
        id: 1,
        normalizedDescription: 'tesco store 123',
        categoryId: 10,
        categorySource: 'rule',
        matchedRuleId: ruleA.id,
        vendorId: 5,
        vendorSource: 'rule',
      }),
    );
    const { rule: ruleB } = createRule({
      pattern: 'sainsburys',
      categoryId: 20,
      vendorId: 6,
      matchType: 'exact',
      priority: 0,
    });
    await flushJob();

    // Editing ruleB to also match "tesco", at a higher priority than ruleA, should
    // make it win the tie-break — but updateRule's reapply-on-edit only re-evaluates
    // transactions previously matched by *ruleB* (none) plus uncategorised ones
    // (none), so txn1 — matched by ruleA — is left untouched by this call.
    updateRule(ruleB.id, { pattern: 'tesco', priority: 10 });
    await flushJob();
    expect(transactionsById.get(1)!.categoryId).toBe(10);

    // reapplyAllRules is the broader, explicitly user-triggered sweep that catches it.
    const { jobId } = reapplyAllRules();
    await flushJob();

    expect(jobResult(jobId).updated).toBe(1);
    const txn = transactionsById.get(1)!;
    expect(txn.categoryId).toBe(20);
    expect(txn.matchedRuleId).toBe(ruleB.id);
    expect(txn.vendorId).toBe(6);
  });

  it('tracks category and vendor independently: a manual category does not block a rule-sourced vendor update', async () => {
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
    await flushJob();

    const { jobId } = reapplyAllRules();
    await flushJob();

    expect(jobResult(jobId).updated).toBe(1);
    const txn = transactionsById.get(1)!;
    expect(txn.categoryId).toBe(99);
    expect(txn.categorySource).toBe('manual');
    expect(txn.vendorId).toBe(5);
    expect(txn.vendorSource).toBe('rule');
  });
});

describe('deleteRule', () => {
  it('clears matchedRuleId on transactions that pointed at the deleted rule, leaving category/vendor intact', async () => {
    const { rule } = createRule({ pattern: 'tesco', categoryId: 10, vendorId: 5, matchType: 'exact', priority: 0 });
    await flushJob();
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

describe('updateRule reapply-on-edit', () => {
  it('reapplies to a transaction previously matched by the edited rule and picks up a separate uncategorised transaction in the same call', async () => {
    const { rule } = createRule({ pattern: 'tesco', categoryId: 10, vendorId: 5, matchType: 'exact', priority: 0 });
    await flushJob();
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
    transactionsById.set(2, makeTransaction({ id: 2, normalizedDescription: 'tesco express 456' }));

    // Widening the pattern still matches txn1 (previously matched by this rule)
    // and now also catches txn2 (previously uncategorised) in the same edit.
    updateRule(rule.id, { pattern: 'tesco' });
    await flushJob();

    expect(transactionsById.get(1)!.categoryId).toBe(10);
    expect(transactionsById.get(2)!.categoryId).toBe(10);
    expect(transactionsById.get(2)!.matchedRuleId).toBe(rule.id);
  });
});

describe('deleteAllRules', () => {
  it('deletes every rule and clears matchedRuleId bookkeeping, leaving category/vendor fields untouched', async () => {
    const { rule: ruleA } = createRule({ pattern: 'tesco', categoryId: 10, vendorId: 5, matchType: 'exact', priority: 0 });
    await flushJob();
    const { rule: ruleB } = createRule({ pattern: 'sainsburys', categoryId: 20, vendorId: 6, matchType: 'exact', priority: 0 });
    await flushJob();
    transactionsById.set(
      1,
      makeTransaction({
        id: 1,
        normalizedDescription: 'tesco store 123',
        categoryId: 10,
        categorySource: 'rule',
        matchedRuleId: ruleA.id,
        vendorId: 5,
        vendorSource: 'rule',
      }),
    );
    transactionsById.set(
      2,
      makeTransaction({
        id: 2,
        normalizedDescription: 'sainsburys local',
        categoryId: 20,
        categorySource: 'rule',
        matchedRuleId: ruleB.id,
        vendorId: 6,
        vendorSource: 'rule',
      }),
    );

    deleteAllRules();

    expect(rulesById.size).toBe(0);
    const txn1 = transactionsById.get(1)!;
    const txn2 = transactionsById.get(2)!;
    expect(txn1.matchedRuleId).toBeNull();
    expect(txn2.matchedRuleId).toBeNull();
    expect(txn1.categoryId).toBe(10);
    expect(txn1.vendorId).toBe(5);
    expect(txn2.categoryId).toBe(20);
    expect(txn2.vendorId).toBe(6);
  });
});

describe('recategorise job chunking', () => {
  it('processes a batch larger than the yield chunk size (25) and reports full progress on completion', async () => {
    for (let i = 1; i <= 30; i++) {
      transactionsById.set(i, makeTransaction({ id: i, normalizedDescription: `merchant ${i}` }));
    }

    const { jobId } = recategoriseUncategorised();
    // Unlike the small-batch tests above, 30 candidates crosses YIELD_EVERY (25),
    // so this job genuinely yields the event loop and finishes asynchronously.
    await new Promise((resolve) => setTimeout(resolve, 50));

    const job = jobsById.get(jobId);
    expect(job?.status).toBe('completed');
    expect(job?.processed).toBe(30);
    expect(job?.total).toBe(30);
  });
});

describe('bulkImportRules', () => {
  const columnMapping = { pattern: 'Pattern', category: 'Category', vendor: 'Vendor' };

  it('creates a rule with a category and vendor resolved by name, creating both if new, and starts a recategorise job', async () => {
    const result = bulkImportRules({
      csvContent: 'Pattern,Category,Vendor\ntesco,Groceries,Tesco\n',
      columnMapping,
    });
    await flushJob();

    expect(result.rulesCreated).toBe(1);
    expect(result.categoriesCreated).toBe(1);
    expect(result.vendorsCreated).toBe(1);
    expect(typeof result.jobId).toBe('number');
    const rule = [...rulesById.values()][0]!;
    expect(rule.pattern).toBe('tesco');
    expect(categoriesByName.get('Groceries')!.id).toBe(rule.categoryId);
    expect(vendorsByName.get('Tesco')!.id).toBe(rule.vendorId);
  });

  it('reuses an existing category and vendor by name instead of creating duplicates', async () => {
    bulkImportRules({ csvContent: 'Pattern,Category,Vendor\ntesco,Groceries,Tesco\n', columnMapping });
    await flushJob();
    const result = bulkImportRules({
      csvContent: 'Pattern,Category,Vendor\ntesco express,Groceries,Tesco\n',
      columnMapping,
    });
    await flushJob();

    expect(result.rulesCreated).toBe(1);
    expect(result.categoriesCreated).toBe(0);
    expect(result.vendorsCreated).toBe(0);
    expect(rulesById.size).toBe(2);
  });

  it('skips a row missing the vendor column value, and does not start a job when no rules were created', () => {
    const result = bulkImportRules({
      csvContent: 'Pattern,Category,Vendor\ntesco,Groceries,\n',
      columnMapping,
    });

    expect(result.rulesCreated).toBe(0);
    expect(result.categoriesCreated).toBe(0);
    expect(result.vendorsCreated).toBe(0);
    expect(result.jobId).toBeNull();
    expect(rulesById.size).toBe(0);
  });
});
