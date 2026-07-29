import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const areas = sqliteTable('areas', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  createdAt: integer('created_at').notNull(),
});
