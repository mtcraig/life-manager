import { z } from 'zod';
import { ENERGY_UNITS, METER_TYPES } from '../enums.js';

export interface EnergyReadingDto {
  id: number;
  meterType: (typeof METER_TYPES)[number];
  readingDate: string;
  value: number;
  unit: (typeof ENERGY_UNITS)[number];
  notes: string | null;
  createdAt: string;
}

export const createEnergyReadingSchema = z.object({
  meterType: z.enum(METER_TYPES),
  readingDate: z.string(),
  value: z.number(),
  unit: z.enum(ENERGY_UNITS),
  notes: z.string().min(1).optional(),
});
export type CreateEnergyReadingInput = z.infer<typeof createEnergyReadingSchema>;

/**
 * Fixed-format CSV import (unlike account ingestion's configurable column
 * mapping) — readings are the app's own domain data, not an external bank
 * export whose format varies per institution. Expected headers:
 * meterType,readingDate,value,unit,notes
 */
export const bulkImportEnergyReadingsSchema = z.object({
  csvContent: z.string().min(1),
});
export type BulkImportEnergyReadingsInput = z.infer<typeof bulkImportEnergyReadingsSchema>;

export interface BulkImportEnergyReadingsResultDto {
  readingsCreated: number;
  readingsSkipped: number;
}
