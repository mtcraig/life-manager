import { and, asc, desc, eq, gte, inArray, isNull, lt, lte, or, sql } from 'drizzle-orm';
import type { TransactionExportQuery, TransactionListQuery } from '@life-manager/shared';
import { db } from '../../db/client';
import { transactions } from '../../db/schema/transactions';
import { categories } from '../../db/schema/categories';
import { accounts } from '../../db/schema/accounts';
import { vendors } from '../../db/schema/vendors';

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
  vendorId: number | null;
  vendorSource: string | null;
  balanceAfter: number | null;
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
  vendorId: number | null;
  vendorSource: string | null;
  balanceAfter: number | null;
}

function buildFilters(query: TransactionListQuery | TransactionExportQuery) {
  const conditions = [];
  if (query.accountId !== undefined) conditions.push(eq(transactions.accountId, query.accountId));
  if (query.dateFrom !== undefined) conditions.push(gte(transactions.date, query.dateFrom));
  if (query.dateTo !== undefined) conditions.push(lte(transactions.date, query.dateTo));
  if (query.categoryId !== undefined) conditions.push(eq(transactions.categoryId, query.categoryId));
  if (query.vendorId !== undefined) conditions.push(eq(transactions.vendorId, query.vendorId));
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

export interface ExportTransactionRow {
  date: string;
  accountName: string | null;
  description: string;
  categoryName: string | null;
  vendorName: string | null;
  amount: number;
}

/** Every transaction matching the given filters, with names joined in — no pagination, since an export covers the whole filtered set. */
export function listAllTransactionsForExport(query: TransactionExportQuery): ExportTransactionRow[] {
  const where = buildFilters(query);
  return db
    .select({
      date: transactions.date,
      accountName: accounts.name,
      description: transactions.description,
      categoryName: categories.name,
      vendorName: vendors.name,
      amount: transactions.amount,
    })
    .from(transactions)
    .leftJoin(accounts, eq(transactions.accountId, accounts.id))
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .leftJoin(vendors, eq(transactions.vendorId, vendors.id))
    .where(where)
    .orderBy(desc(transactions.date), desc(transactions.id))
    .all();
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

/**
 * Transactions eligible for automatic re-matching when rules change: either
 * field (category or vendor) is never-set or last-set by a rule (not a
 * manual override, which must never be silently overwritten by a rule
 * change). The per-field overwrite decision itself is made independently in
 * reapplyRulesTo — this only widens the candidate set to anything that could
 * plausibly need a write to either field.
 */
export function listUncategorisedOrRuleSourced(): TransactionRow[] {
  return db
    .select()
    .from(transactions)
    .where(
      or(
        isNull(transactions.categoryId),
        eq(transactions.categorySource, 'rule'),
        isNull(transactions.vendorId),
        eq(transactions.vendorSource, 'rule'),
      ),
    )
    .all();
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

export function setTransactionVendor(
  id: number,
  vendorId: number | null,
  vendorSource: string | null,
): TransactionRow | undefined {
  return db
    .update(transactions)
    .set({ vendorId, vendorSource, matchedRuleId: null })
    .where(eq(transactions.id, id))
    .returning()
    .get();
}

/** Clears the "which rule matched this" bookkeeping field when that rule is deleted, leaving the transaction's own categoryId/vendorId untouched. */
export function clearMatchedRuleId(ruleId: number): void {
  db.update(transactions).set({ matchedRuleId: null }).where(eq(transactions.matchedRuleId, ruleId)).run();
}

/** Used by reapplyRulesTo, which computes both fields together in one pass per transaction. */
export function setTransactionCategoryAndVendor(
  id: number,
  fields: {
    categoryId: number | null;
    categorySource: string | null;
    matchedRuleId: number | null;
    vendorId: number | null;
    vendorSource: string | null;
  },
): TransactionRow | undefined {
  return db.update(transactions).set(fields).where(eq(transactions.id, id)).returning().get();
}

export interface AnalyticsTransactionRow {
  date: string;
  amount: number;
  isTransfer: boolean;
  balanceAfter: number | null;
}

/**
 * Flat (date, amount, isTransfer, balanceAfter) rows for analytics aggregation
 * — the money-flow and balance-trend calculations both start from this,
 * joining categories to get is_transfer since that flag lives on the
 * category, not the transaction itself. Uncategorised transactions
 * (categoryId null) surface as isTransfer: false.
 *
 * Ordered by (date, id) ascending — money-flow's per-date grouping doesn't
 * care about order, but computeBalanceTrend's same-day tiebreak (which
 * balanceAfter wins when multiple transactions share a date) does, so this
 * ordering is load-bearing for that calculation.
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
      balanceAfter: transactions.balanceAfter,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(where)
    .orderBy(asc(transactions.date), asc(transactions.id))
    .all();

  return rows.map((row) => ({
    date: row.date,
    amount: row.amount,
    isTransfer: row.isTransfer ?? false,
    balanceAfter: row.balanceAfter,
  }));
}

export interface CategorisedTransactionAmountRow {
  date: string;
  amount: number;
  categoryId: number | null;
  categoryName: string | null;
}

/**
 * Flat (amount, categoryId, categoryName) rows for a given account/date
 * range, with no grouping/filtering applied — grouping into a per-category
 * spending summary is done by the pure groupCategorySummary function so it
 * stays unit-testable without a database.
 */
export function listCategorisedTransactionAmounts(params: {
  accountId?: number;
  dateFrom?: string;
  dateTo?: string;
}): CategorisedTransactionAmountRow[] {
  const conditions = [];
  if (params.accountId !== undefined) conditions.push(eq(transactions.accountId, params.accountId));
  if (params.dateFrom !== undefined) conditions.push(gte(transactions.date, params.dateFrom));
  if (params.dateTo !== undefined) conditions.push(lte(transactions.date, params.dateTo));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  return db
    .select({
      date: transactions.date,
      amount: transactions.amount,
      categoryId: transactions.categoryId,
      categoryName: categories.name,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(where)
    .all();
}

export interface TopTransactionRow {
  id: number;
  date: string;
  description: string;
  amount: number;
  categoryName: string | null;
}

/**
 * The largest income (direction 'in') or expense (direction 'out') transactions
 * in a date range, biggest first. Transfers are excluded, matching the
 * money-in/out convention (a transfer isn't real income or spending).
 */
export function listTopTransactionsByAmount(params: {
  accountId?: number;
  dateFrom?: string;
  dateTo?: string;
  direction: 'in' | 'out';
  limit: number;
}): TopTransactionRow[] {
  const conditions = [params.direction === 'in' ? gte(transactions.amount, 0) : lt(transactions.amount, 0)];
  if (params.accountId !== undefined) conditions.push(eq(transactions.accountId, params.accountId));
  if (params.dateFrom !== undefined) conditions.push(gte(transactions.date, params.dateFrom));
  if (params.dateTo !== undefined) conditions.push(lte(transactions.date, params.dateTo));
  conditions.push(or(isNull(categories.isTransfer), eq(categories.isTransfer, false))!);

  return db
    .select({
      id: transactions.id,
      date: transactions.date,
      description: transactions.description,
      amount: transactions.amount,
      categoryName: categories.name,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(params.direction === 'in' ? desc(transactions.amount) : asc(transactions.amount))
    .limit(params.limit)
    .all();
}

/** Earliest transaction date on record, so year filters can offer only years with real data. */
export function getEarliestTransactionDate(accountId?: number): string | null {
  const where = accountId !== undefined ? eq(transactions.accountId, accountId) : undefined;
  const { earliest } = db
    .select({ earliest: sql<string | null>`min(${transactions.date})` })
    .from(transactions)
    .where(where)
    .get() as { earliest: string | null };
  return earliest;
}
