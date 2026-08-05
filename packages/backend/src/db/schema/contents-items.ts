import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { areas } from './areas';
import { properties } from './properties';

export const contentsItems = sqliteTable('contents_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  areaId: integer('area_id')
    .notNull()
    .references(() => areas.id),
  // Nullable: items created before this field existed have no property until edited.
  propertyId: integer('property_id').references(() => properties.id),
  value: integer('value').notNull(),
  purchaseDate: text('purchase_date'),
  notes: text('notes'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
