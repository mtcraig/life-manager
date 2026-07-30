import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

/** Single-row table (id fixed at 1) holding app-wide preferences, e.g. the display name shown on the Home page. */
export const appSettings = sqliteTable('app_settings', {
  id: integer('id').primaryKey(),
  userName: text('user_name'),
  updatedAt: integer('updated_at').notNull(),
});
