import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { areas } from './areas';

export const contentsItems = sqliteTable('contents_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  areaId: integer('area_id')
    .notNull()
    .references(() => areas.id),
  value: integer('value').notNull(),
  purchaseDate: text('purchase_date'),
  notes: text('notes'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
