import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const insurancePlans = sqliteTable('insurance_plans', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type').notNull(),
  coverageAmount: integer('coverage_amount'),
  excessAmount: integer('excess_amount'),
  premiumAmount: integer('premium_amount').notNull(),
  premiumFrequency: text('premium_frequency').notNull(),
  effectiveDate: text('effective_date').notNull(),
  renewalDate: text('renewal_date').notNull(),
  provider: text('provider'),
  notes: text('notes'),
  policyNumber: text('policy_number'),
  vehicleRegistration: text('vehicle_registration'),
  postcode: text('postcode'),
  cancelledAt: integer('cancelled_at'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
