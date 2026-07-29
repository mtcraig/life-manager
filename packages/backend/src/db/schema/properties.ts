import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const properties = sqliteTable('properties', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  address: text('address'),
  notes: text('notes'),
  archivedAt: integer('archived_at'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const propertyValuations = sqliteTable(
  'property_valuations',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    propertyId: integer('property_id')
      .notNull()
      .references(() => properties.id),
    asOfDate: text('as_of_date').notNull(),
    value: integer('value').notNull(),
    notes: text('notes'),
    createdAt: integer('created_at').notNull(),
  },
  (table) => ({
    propertyAsOfUnique: uniqueIndex('property_valuations_unique').on(
      table.propertyId,
      table.asOfDate,
    ),
  }),
);
