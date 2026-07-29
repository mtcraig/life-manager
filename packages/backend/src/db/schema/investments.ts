import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const investments = sqliteTable('investments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  kind: text('kind'),
  notes: text('notes'),
  archivedAt: integer('archived_at'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const investmentValuations = sqliteTable(
  'investment_valuations',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    investmentId: integer('investment_id')
      .notNull()
      .references(() => investments.id),
    asOfDate: text('as_of_date').notNull(),
    value: integer('value').notNull(),
    notes: text('notes'),
    createdAt: integer('created_at').notNull(),
  },
  (table) => ({
    investmentAsOfUnique: uniqueIndex('investment_valuations_unique').on(
      table.investmentId,
      table.asOfDate,
    ),
  }),
);
