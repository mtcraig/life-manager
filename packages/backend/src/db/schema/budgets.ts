import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { categories } from './categories';

export const budgets = sqliteTable('budgets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  categoryId: integer('category_id')
    .notNull()
    .references(() => categories.id),
  amount: integer('amount').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date'),
  notes: text('notes'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
