import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const projectionScenarios = sqliteTable('projection_scenarios', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  growthRatePct: real('growth_rate_pct').notNull(),
  monthlyContribution: integer('monthly_contribution').notNull().default(0),
  retirementAge: integer('retirement_age'),
  retirementDate: text('retirement_date'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
