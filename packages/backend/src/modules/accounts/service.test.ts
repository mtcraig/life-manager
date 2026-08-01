import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AccountRow } from './repo';

const accountsById = new Map<number, AccountRow>();
const transactionAccountIds = new Set<number>();
const ingestionEventAccountIds = new Set<number>();
const syncWatchers = vi.fn();
const prepareIngestPlan = vi.fn((accountId: number, source: string) => ({
  accountId,
  source,
  rules: [],
  files: [],
  totalNewRows: 3,
}));
const runIngestJob = vi.fn(async (...args: [number, unknown]) => void args);
const createJob = vi.fn((...args: [string, number]) => {
  void args;
  return { id: 42, kind: 'ingest', status: 'running', total: 3, processed: 0 };
});
const failJob = vi.fn((...args: [number, string]) => void args);
let nextId = 100;

vi.mock('./repo', () => ({
  getAccountById: vi.fn((id: number) => accountsById.get(id)),
  listAccounts: vi.fn(() => [...accountsById.values()]),
  insertAccount: vi.fn((fields: Omit<AccountRow, 'id' | 'createdAt' | 'updatedAt'>) => {
    const row: AccountRow = { ...fields, id: nextId++, createdAt: Date.now(), updatedAt: Date.now() };
    accountsById.set(row.id, row);
    return row;
  }),
  updateAccount: vi.fn((id: number, fields: Partial<AccountRow>) => {
    const existing = accountsById.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...fields, updatedAt: Date.now() };
    accountsById.set(id, updated);
    return updated;
  }),
  deleteAccount: vi.fn((id: number) => {
    if (!accountsById.has(id)) return false;
    transactionAccountIds.delete(id);
    ingestionEventAccountIds.delete(id);
    accountsById.delete(id);
    return true;
  }),
}));

vi.mock('../ingestion/watcher', () => ({
  syncWatchers: (...args: unknown[]) => syncWatchers(...args),
}));

vi.mock('../ingestion/ingestService', () => ({
  prepareIngestPlan: (accountId: number, source: string) => prepareIngestPlan(accountId, source),
  runIngestJob: (jobId: number, plan: unknown) => runIngestJob(jobId, plan),
}));

vi.mock('../jobs/repo', () => ({
  createJob: (kind: string, total: number) => createJob(kind, total),
  failJob: (jobId: number, message: string) => failJob(jobId, message),
}));

const { createAccount, deleteAccount, updateAccount } = await import('./service');

function makeAccount(overrides: Partial<AccountRow> & { id: number }): AccountRow {
  return {
    name: `Account ${overrides.id}`,
    type: 'current',
    institution: null,
    ingestionMode: 'manual',
    folderPath: null,
    columnMapping: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

const SAMPLE_MAPPING = { date: 'Date', description: 'Description', amount: 'Amount', dateFormat: 'YYYY-MM-DD' as const };

beforeEach(() => {
  accountsById.clear();
  transactionAccountIds.clear();
  ingestionEventAccountIds.clear();
  syncWatchers.mockClear();
  prepareIngestPlan.mockClear();
  runIngestJob.mockClear();
  createJob.mockClear();
  failJob.mockClear();
});

describe('deleteAccount', () => {
  it('removes the account along with its transactions and ingestion events', () => {
    accountsById.set(1, makeAccount({ id: 1 }));
    transactionAccountIds.add(1);
    ingestionEventAccountIds.add(1);

    deleteAccount(1);

    expect(accountsById.has(1)).toBe(false);
    expect(transactionAccountIds.has(1)).toBe(false);
    expect(ingestionEventAccountIds.has(1)).toBe(false);
  });

  it('calls syncWatchers after a successful delete', () => {
    accountsById.set(1, makeAccount({ id: 1 }));

    deleteAccount(1);

    expect(syncWatchers).toHaveBeenCalledTimes(1);
  });

  it('throws a 404 for an unknown account id', () => {
    expect(() => deleteAccount(999)).toThrow();
    expect(syncWatchers).not.toHaveBeenCalled();
  });
});

describe('createAccount', () => {
  it('does not trigger an ingest job when no folder is configured', () => {
    const result = createAccount({
      name: 'No folder',
      type: 'current',
      ingestionMode: 'manual',
    } as Parameters<typeof createAccount>[0]);

    expect(result.ingestJobId).toBeNull();
    expect(prepareIngestPlan).not.toHaveBeenCalled();
  });

  it('triggers an initial ingest job when folderPath and columnMapping are both set', () => {
    const result = createAccount({
      name: 'Watched',
      type: 'current',
      ingestionMode: 'watched',
      folderPath: '/watched/folder',
      columnMapping: SAMPLE_MAPPING,
    } as Parameters<typeof createAccount>[0]);

    expect(result.ingestJobId).toBe(42);
    expect(prepareIngestPlan).toHaveBeenCalledWith(result.id, 'watch');
    expect(runIngestJob).toHaveBeenCalledWith(42, expect.objectContaining({ totalNewRows: 3 }));
  });
});

describe('updateAccount', () => {
  it('does not re-trigger an ingest job on an edit that leaves folderPath untouched', () => {
    accountsById.set(1, makeAccount({ id: 1, folderPath: '/existing', columnMapping: SAMPLE_MAPPING }));

    const result = updateAccount(1, { name: 'Renamed' });

    expect(result.ingestJobId).toBeNull();
    expect(prepareIngestPlan).not.toHaveBeenCalled();
  });

  it('triggers an ingest job when folderPath is newly set on an existing account', () => {
    accountsById.set(1, makeAccount({ id: 1 }));

    const result = updateAccount(1, { folderPath: '/new/folder', columnMapping: SAMPLE_MAPPING });

    expect(result.ingestJobId).toBe(42);
    expect(prepareIngestPlan).toHaveBeenCalledWith(1, 'watch');
  });
});
