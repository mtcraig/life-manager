import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const liabilities = sqliteTable('liabilities', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  kind: text('kind'),
  notes: text('notes'),
  archivedAt: integer('archived_at'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const liabilityValuations = sqliteTable(
  'liability_valuations',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    liabilityId: integer('liability_id')
      .notNull()
      .references(() => liabilities.id),
    asOfDate: text('as_of_date').notNull(),
    value: integer('value').notNull(),
    notes: text('notes'),
    createdAt: integer('created_at').notNull(),
  },
  (table) => ({
    liabilityAsOfUnique: uniqueIndex('liability_valuations_unique').on(
      table.liabilityId,
      table.asOfDate,
    ),
  }),
);
