import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const utilityTariffs = sqliteTable('utility_tariffs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  meterType: text('meter_type').notNull(),
  providerName: text('provider_name').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date'),
  standingChargePerDay: real('standing_charge_per_day').notNull(),
  unitRate: real('unit_rate').notNull(),
  wastewaterStandingChargePerDay: real('wastewater_standing_charge_per_day'),
  wastewaterUnitRate: real('wastewater_unit_rate'),
  rainwaterRemovalStandingChargePerDay: real('rainwater_removal_standing_charge_per_day'),
  calorificValue: real('calorific_value'),
  notes: text('notes'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
