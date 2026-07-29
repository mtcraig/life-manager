import { and, desc, eq, gte, inArray, isNull, lte, sql } from 'drizzle-orm';
import type { TransactionListQuery } from '@life-manager/shared';
import { db } from '../../db/client';
import { transactions } from '../../db/schema/transactions';
import { categories } from '../../db/schema/categories';

export interface TransactionRow {
  id: number;
  accountId: number;
  date: string;
  amount: number;
  description: string;
  normalizedDescription: string;
  categoryId: number | null;
  categorySource: string | null;
  matchedRuleId: number | null;
  dedupeHash: string;
  rawCsvRow: unknown;
  importedAt: number;
}

export interface NewTransactionFields {
  accountId: number;
  date: string;
  amount: number;
  description: string;
  normalizedDescription: string;
  dedupeHash: string;
  rawCsvRow: Record<string, string>;
  categoryId: number | null;
  categorySource: string | null;
  matchedRuleId: number | null;
}

function buildFilters(query: TransactionListQuery) {
  const conditions = [];
  if (query.accountId !== undefined) conditions.push(eq(transactions.accountId, query.accountId));
  if (query.dateFrom !== undefined) conditions.push(gte(transactions.date, query.dateFrom));
  if (query.dateTo !== undefined) conditions.push(lte(transactions.date, query.dateTo));
  if (query.categoryId !== undefined) conditions.push(eq(transactions.categoryId, query.categoryId));
  if (query.uncategorisedOnly) conditions.push(isNull(transactions.categoryId));
  return conditions.length > 0 ? and(...conditions) : undefined;
}

export function listTransactions(query: TransactionListQuery): {
  items: TransactionRow[];
  total: number;
} {
  const where = buildFilters(query);
  const offset = (query.page - 1) * query.pageSize;

  const items = db
    .select()
    .from(transactions)
    .where(where)
    .orderBy(desc(transactions.date), desc(transactions.id))
    .limit(query.pageSize)
    .offset(offset)
    .all();

  const { count } = db
    .select({ count: sql<number>`count(*)` })
    .from(transactions)
    .where(where)
    .get() as { count: number };

  return { items, total: count };
}

/** Returns the subset of the given dedupe hashes that already exist for this account. */
export function findExistingDedupeHashes(accountId: number, hashes: string[]): Set<string> {
  if (hashes.length === 0) return new Set();
  const rows = db
    .select({ dedupeHash: transactions.dedupeHash })
    .from(transactions)
    .where(and(eq(transactions.accountId, accountId), inArray(transactions.dedupeHash, hashes)))
    .all();
  return new Set(rows.map((r) => r.dedupeHash));
}

export function insertTransactions(
  rows: (NewTransactionFields & { dedupeHash: string })[],
): number {
  if (rows.length === 0) return 0;
  const now = Date.now();
  db.insert(transactions)
    .values(rows.map((row) => ({ ...row, importedAt: now })))
    .run();
  return rows.length;
}

export function listUncategorised(): TransactionRow[] {
  return db.select().from(transactions).where(isNull(transactions.categoryId)).all();
}

export function setTransactionCategory(
  id: number,
  categoryId: number | null,
  categorySource: string | null,
  matchedRuleId: number | null,
): TransactionRow | undefined {
  return db
    .update(transactions)
    .set({ categoryId, categorySource, matchedRuleId })
    .where(eq(transactions.id, id))
    .returning()
    .get();
}

export interface AnalyticsTransactionRow {
  date: string;
  amount: number;
  isTransfer: boolean;
}

/**
 * Flat (date, amount, isTransfer) rows for analytics aggregation — the money-flow
 * and balance-trend calculations both start from this, joining categories to get
 * is_transfer since that flag lives on the category, not the transaction itself.
 * Uncategorised transactions (categoryId null) surface as isTransfer: false.
 */
export function listTransactionAmountsWithTransferFlag(params: {
  accountId?: number;
  dateFrom?: string;
  dateTo?: string;
}): AnalyticsTransactionRow[] {
  const conditions = [];
  if (params.accountId !== undefined) conditions.push(eq(transactions.accountId, params.accountId));
  if (params.dateFrom !== undefined) conditions.push(gte(transactions.date, params.dateFrom));
  if (params.dateTo !== undefined) conditions.push(lte(transactions.date, params.dateTo));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = db
    .select({
      date: transactions.date,
      amount: transactions.amount,
      isTransfer: categories.isTransfer,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(where)
    .all();

  return rows.map((row) => ({
    date: row.date,
    amount: row.amount,
    isTransfer: row.isTransfer ?? false,
  }));
}

/**
 * Total transaction amount per account (including transfers, since transfers
 * are real money movements) — used by the Wealth aggregation to derive each
 * account's contribution to liquid assets.
 */
export function sumAmountsByAccount(): Map<number, number> {
  const rows = db
    .select({ accountId: transactions.accountId, total: sql<number>`sum(${transactions.amount})` })
    .from(transactions)
    .groupBy(transactions.accountId)
    .all();
  const totals = new Map<number, number>();
  for (const row of rows) {
    totals.set(row.accountId, row.total);
  }
  return totals;
}
