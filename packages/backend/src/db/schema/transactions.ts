import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { accounts } from './accounts';
import { categories } from './categories';
import { categorisationRules } from './categorisation-rules';

export const transactions = sqliteTable(
  'transactions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    accountId: integer('account_id')
      .notNull()
      .references(() => accounts.id),
    date: text('date').notNull(),
    amount: integer('amount').notNull(),
    description: text('description').notNull(),
    normalizedDescription: text('normalized_description').notNull(),
    // Uncategorised transaction is represented by categoryId IS NULL.
    categoryId: integer('category_id').references(() => categories.id),
    categorySource: text('category_source'),
    matchedRuleId: integer('matched_rule_id').references(() => categorisationRules.id),
    // Bank-reported balance after this transaction, when the CSV's column mapping
    // includes a balance column. Null for rows/accounts without one.
    balanceAfter: integer('balance_after'),
    dedupeHash: text('dedupe_hash').notNull(),
    rawCsvRow: text('raw_csv_row', { mode: 'json' }),
    importedAt: integer('imported_at').notNull(),
  },
  (table) => ({
    accountDedupeUnique: uniqueIndex('transactions_account_dedupe_unique').on(
      table.accountId,
      table.dedupeHash,
    ),
  }),
);
