import type { EnergyUnit } from '../enums.js';

const LITRES_PER_M3 = 1000;

/**
 * Water readings may be entered in litres or m3 (unit is stored per-reading,
 * not per-meter), so a single meter's history can legitimately mix units.
 * Tariff unit rates are always £/m3, so usage/cost math normalizes every
 * reading to m3 first rather than migrating historical data.
 */
export function normalizeWaterUsageToM3(value: number, unit: EnergyUnit): number {
  if (unit === 'litres') return value / LITRES_PER_M3;
  return value;
}
