import { sqliteTable, text, integer, real, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const energyReadings = sqliteTable(
  'energy_readings',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    meterType: text('meter_type').notNull(),
    readingDate: text('reading_date').notNull(),
    value: real('value').notNull(),
    unit: text('unit').notNull(),
    notes: text('notes'),
    createdAt: integer('created_at').notNull(),
  },
  (table) => ({
    meterDateUnique: uniqueIndex('energy_readings_unique').on(table.meterType, table.readingDate),
  }),
);
