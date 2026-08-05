import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

/** Single-row table (id fixed at 1) holding app-wide preferences, e.g. the display name shown on the Home page. */
export const appSettings = sqliteTable('app_settings', {
  id: integer('id').primaryKey(),
  userName: text('user_name'),
  /** 'description' | 'category_vendor' - which label the Home page's top-transactions cards show. Null means the app-level default ('description'). */
  topTransactionsDisplay: text('top_transactions_display'),
  /** 'dd_mm' | 'mm_dd' - which order the frontend renders date parts in. Null means the app-level default ('dd_mm'). */
  dateFormat: text('date_format'),
  updatedAt: integer('updated_at').notNull(),
});
