import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const backgroundJobs = sqliteTable('background_jobs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  kind: text('kind').notNull(),
  status: text('status').notNull().default('running'),
  total: integer('total').notNull(),
  processed: integer('processed').notNull().default(0),
  resultJson: text('result_json'),
  errorMessage: text('error_message'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
