import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AccountRow } from './repo';

const accountsById = new Map<number, AccountRow>();
const transactionAccountIds = new Set<number>();
const ingestionEventAccountIds = new Set<number>();
const syncWatchers = vi.fn();

vi.mock('./repo', () => ({
  getAccountById: vi.fn((id: number) => accountsById.get(id)),
  listAccounts: vi.fn(() => [...accountsById.values()]),
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

const { deleteAccount } = await import('./service');

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

beforeEach(() => {
  accountsById.clear();
  transactionAccountIds.clear();
  ingestionEventAccountIds.clear();
  syncWatchers.mockClear();
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
