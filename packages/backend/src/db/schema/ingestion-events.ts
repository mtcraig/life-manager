import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { accounts } from './accounts';

export const ingestionEvents = sqliteTable('ingestion_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  accountId: integer('account_id').references(() => accounts.id),
  source: text('source').notNull(),
  fileName: text('file_name').notNull(),
  status: text('status').notNull(),
  rowsIngested: integer('rows_ingested').notNull().default(0),
  errorMessage: text('error_message'),
  ranAt: integer('ran_at').notNull(),
});
