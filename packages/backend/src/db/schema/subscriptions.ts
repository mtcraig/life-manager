import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { categories } from './categories';

export const subscriptions = sqliteTable('subscriptions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  provider: text('provider'),
  amount: integer('amount').notNull(),
  frequency: text('frequency').notNull(),
  categoryId: integer('category_id').references(() => categories.id),
  startDate: text('start_date').notNull(),
  nextRenewalDate: text('next_renewal_date').notNull(),
  cancelledAt: integer('cancelled_at'),
  notes: text('notes'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
