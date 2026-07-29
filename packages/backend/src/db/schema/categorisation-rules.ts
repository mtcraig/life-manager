import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { categories } from './categories';

export const categorisationRules = sqliteTable('categorisation_rules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  pattern: text('pattern').notNull(),
  categoryId: integer('category_id')
    .notNull()
    .references(() => categories.id),
  matchType: text('match_type').notNull().default('fuzzy'),
  priority: integer('priority').notNull().default(0),
  source: text('source').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
