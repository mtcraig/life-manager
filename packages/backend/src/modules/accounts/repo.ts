import { eq, isNull } from 'drizzle-orm';
import type { ColumnMapping } from '@life-manager/shared';
import { db } from '../../db/client';
import { accounts } from '../../db/schema/accounts';

export interface AccountRow {
  id: number;
  name: string;
  type: string;
  institution: string | null;
  ingestionMode: string;
  folderPath: string | null;
  columnMapping: Record<string, string> | null;
  archivedAt: number | null;
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

export function listAccounts(includeArchived: boolean): AccountRow[] {
  if (includeArchived) {
    return db.select().from(accounts).all();
  }
  return db.select().from(accounts).where(isNull(accounts.archivedAt)).all();
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

export function archiveAccount(id: number): AccountRow | undefined {
  return db
    .update(accounts)
    .set({ archivedAt: Date.now(), updatedAt: Date.now() })
    .where(eq(accounts.id, id))
    .returning()
    .get();
}
