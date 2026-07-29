import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const accounts = sqliteTable('accounts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  type: text('type').notNull(),
  institution: text('institution'),
  ingestionMode: text('ingestion_mode').notNull().default('manual'),
  // Folder containing this account's transaction CSVs. Read on-demand for 'manual'
  // ingestion mode, or watched continuously for 'watched' mode — same folder either way.
  folderPath: text('folder_path'),
  columnMapping: text('column_mapping', { mode: 'json' }).$type<Record<string, string>>(),
  archivedAt: integer('archived_at'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
