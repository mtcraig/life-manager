import { z } from 'zod';
import { METER_TYPES } from '../enums.js';

/**
 * providerName/startDate/endDate/standingChargePerDay/unitRate apply to every
 * meter type - for water, standingChargePerDay/unitRate represent the
 * freshwater component. The wastewater/rainwater fields are only ever
 * populated when meterType is 'water'. Rates are stored as real pounds (not
 * integer pence, unlike the rest of the app's money columns) since unit
 * rates commonly need sub-penny precision.
 */
export interface UtilityTariffDto {
  id: number;
  meterType: (typeof METER_TYPES)[number];
  providerName: string;
  startDate: string;
  /** Null means ongoing (the current tariff). */
  endDate: string | null;
  standingChargePerDay: number;
  unitRate: number;
  wastewaterStandingChargePerDay: number | null;
  wastewaterUnitRate: number | null;
  rainwaterRemovalStandingChargePerDay: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export const createUtilityTariffSchema = z.object({
  meterType: z.enum(METER_TYPES),
  providerName: z.string().min(1),
  startDate: z.string(),
  endDate: z.string().optional(),
  standingChargePerDay: z.number().nonnegative(),
  unitRate: z.number().nonnegative(),
  wastewaterStandingChargePerDay: z.number().nonnegative().optional(),
  wastewaterUnitRate: z.number().nonnegative().optional(),
  rainwaterRemovalStandingChargePerDay: z.number().nonnegative().optional(),
  notes: z.string().min(1).optional(),
});
export type CreateUtilityTariffInput = z.infer<typeof createUtilityTariffSchema>;

export const updateUtilityTariffSchema = createUtilityTariffSchema.partial();
export type UpdateUtilityTariffInput = z.infer<typeof updateUtilityTariffSchema>;

export const utilityCostSeriesQuerySchema = z.object({
  year: z.coerce.number().int().optional(),
});
export type UtilityCostSeriesQuery = z.infer<typeof utilityCostSeriesQuerySchema>;

/** period is 'YYYY-MM' when a year was requested, 'YYYY' when aggregated across all time. */
export interface UtilityCostPointDto {
  period: string;
  electricity: number;
  gas: number;
  water: number;
}

export interface UtilityCostSeriesDto {
  granularity: 'month' | 'year';
  points: UtilityCostPointDto[];
}
