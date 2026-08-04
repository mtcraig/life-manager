import { asc, eq } from 'drizzle-orm';
import type { ColumnMapping } from '@life-manager/shared';
import { db } from '../../db/client';
import { accounts } from '../../db/schema/accounts';
import { transactions } from '../../db/schema/transactions';
import { ingestionEvents } from '../../db/schema/ingestion-events';

export interface AccountRow {
  id: number;
  name: string;
  type: string;
  institution: string | null;
  ingestionMode: string;
  folderPath: string | null;
  columnMapping: Record<string, string> | null;
  createdAt: number;
  updatedAt: number;
}

export interface AccountWriteFields {
  name: string;
  type: string;
  institution: string | null;
  ingestionMode: string;
  folderPath: string | null;
  columnMapping: ColumnMapping | null;
}

export function listAccounts(): AccountRow[] {
  return db.select().from(accounts).orderBy(asc(accounts.name)).all();
}

export function getAccountById(id: number): AccountRow | undefined {
  return db.select().from(accounts).where(eq(accounts.id, id)).get();
}

export function insertAccount(fields: AccountWriteFields): AccountRow {
  const now = Date.now();
  return db
    .insert(accounts)
    .values({ ...fields, createdAt: now, updatedAt: now })
    .returning()
    .get();
}

export function updateAccount(id: number, fields: Partial<AccountWriteFields>): AccountRow | undefined {
  return db
    .update(accounts)
    .set({ ...fields, updatedAt: Date.now() })
    .where(eq(accounts.id, id))
    .returning()
    .get();
}

/** Cascades: an account's transactions and ingestion history have no onDelete
 * cascade at the FK level, so children are deleted before the parent, all
 * inside one transaction. */
export function deleteAccount(id: number): boolean {
  return db.transaction((tx) => {
    tx.delete(transactions).where(eq(transactions.accountId, id)).run();
    tx.delete(ingestionEvents).where(eq(ingestionEvents.accountId, id)).run();
    const result = tx.delete(accounts).where(eq(accounts.id, id)).run();
    return result.changes > 0;
  });
}
