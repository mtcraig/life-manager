import { parse } from 'csv-parse/sync';
import { ENERGY_UNITS, METER_TYPES, normalizeWaterUsageToM3 } from '@life-manager/shared';
import type {
  BulkImportEnergyReadingsResultDto,
  CreateEnergyReadingInput,
  CreateUtilityTariffInput,
  EnergyReadingDto,
  EnergyUnit,
  MeterType,
  UpdateUtilityTariffInput,
  UtilityCostPointDto,
  UtilityCostSeriesDto,
  UtilityCostSeriesQuery,
  UtilityTariffDto,
} from '@life-manager/shared';
import { HttpError } from '../../lib/httpError';
import { normalizeCsvHeaders } from '../../lib/csv';
import * as repo from './repo';
import type { EnergyReadingRow } from './repo';
import * as tariffRepo from './tariffRepo';
import type { UtilityTariffRow } from './tariffRepo';
import * as costCalculation from './costCalculation';
import type { MeterReadingPoint, TariffPeriod } from './costCalculation';

function toDto(row: EnergyReadingRow): EnergyReadingDto {
  return {
    id: row.id,
    meterType: row.meterType as EnergyReadingDto['meterType'],
    readingDate: row.readingDate,
    value: row.value,
    unit: row.unit as EnergyReadingDto['unit'],
    notes: row.notes,
    createdAt: new Date(row.createdAt).toISOString(),
  };
}

export function listEnergyReadings(): EnergyReadingDto[] {
  return repo.listEnergyReadings().map(toDto);
}

export function createEnergyReading(input: CreateEnergyReadingInput): EnergyReadingDto {
  if (repo.findByMeterAndDate(input.meterType, input.readingDate)) {
    throw new HttpError(
      409,
      `A ${input.meterType} reading for ${input.readingDate} already exists`,
    );
  }
  const row = repo.insertEnergyReading({
    meterType: input.meterType,
    readingDate: input.readingDate,
    value: input.value,
    unit: input.unit,
    notes: input.notes ?? null,
  });
  return toDto(row);
}

export function deleteEnergyReading(id: number): void {
  const deleted = repo.deleteEnergyReading(id);
  if (!deleted) {
    throw new HttpError(404, `Energy reading ${id} not found`);
  }
}

/**
 * Bulk-paste CSV import for the app's own fixed format
 * (meterType,readingDate,value,unit,notes) — see the schema comment in
 * shared/dto/energy-reading.ts for why this isn't the configurable
 * column-mapping approach accounts use. Rows that collide with an existing
 * (meterType, readingDate) reading are skipped rather than erroring, so a
 * CSV can be safely re-pasted.
 */
export function bulkImportEnergyReadings(csvContent: string): BulkImportEnergyReadingsResultDto {
  const records: Record<string, string>[] = parse(csvContent, {
    columns: normalizeCsvHeaders(['meterType', 'readingDate', 'value', 'unit', 'notes']),
    skip_empty_lines: true,
    trim: true,
  });

  let readingsCreated = 0;
  let readingsSkipped = 0;

  for (const row of records) {
    const meterType = row.meterType;
    const readingDate = row.readingDate;
    const rawValue = row.value;
    const unit = row.unit;
    const notes = row.notes;

    if (!meterType || !readingDate || !rawValue || !unit) {
      throw new HttpError(
        400,
        `CSV row missing required column(s) (meterType,readingDate,value,unit): ${JSON.stringify(row)}`,
      );
    }
    if (!(METER_TYPES as readonly string[]).includes(meterType)) {
      throw new HttpError(400, `Unknown meterType "${meterType}" — expected one of ${METER_TYPES.join(', ')}`);
    }
    if (!(ENERGY_UNITS as readonly string[]).includes(unit)) {
      throw new HttpError(400, `Unknown unit "${unit}" — expected one of ${ENERGY_UNITS.join(', ')}`);
    }
    const value = Number(rawValue);
    if (Number.isNaN(value)) {
      throw new HttpError(400, `Invalid numeric value "${rawValue}" for ${meterType} reading on ${readingDate}`);
    }

    if (repo.findByMeterAndDate(meterType, readingDate)) {
      readingsSkipped += 1;
      continue;
    }

    repo.insertEnergyReading({
      meterType,
      readingDate,
      value,
      unit,
      notes: notes && notes.length > 0 ? notes : null,
    });
    readingsCreated += 1;
  }

  return { readingsCreated, readingsSkipped };
}

function toTariffDto(row: UtilityTariffRow): UtilityTariffDto {
  return {
    id: row.id,
    meterType: row.meterType as UtilityTariffDto['meterType'],
    providerName: row.providerName,
    startDate: row.startDate,
    endDate: row.endDate,
    standingChargePerDay: row.standingChargePerDay,
    unitRate: row.unitRate,
    wastewaterStandingChargePerDay: row.wastewaterStandingChargePerDay,
    wastewaterUnitRate: row.wastewaterUnitRate,
    rainwaterRemovalStandingChargePerDay: row.rainwaterRemovalStandingChargePerDay,
    notes: row.notes,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

export function listUtilityTariffs(): UtilityTariffDto[] {
  return tariffRepo.listUtilityTariffs().map(toTariffDto);
}

export function getUtilityTariff(id: number): UtilityTariffDto {
  const row = tariffRepo.getUtilityTariffById(id);
  if (!row) {
    throw new HttpError(404, `Utility tariff ${id} not found`);
  }
  return toTariffDto(row);
}

function tariffsOverlap(
  a: { startDate: string; endDate: string | null },
  b: { startDate: string; endDate: string | null },
): boolean {
  const aEnd = a.endDate ?? '9999-12-31';
  const bEnd = b.endDate ?? '9999-12-31';
  return a.startDate <= bEnd && b.startDate <= aEnd;
}

function validateWastewaterPairing(input: {
  wastewaterStandingChargePerDay?: number;
  wastewaterUnitRate?: number;
}): void {
  const hasCharge = input.wastewaterStandingChargePerDay !== undefined;
  const hasRate = input.wastewaterUnitRate !== undefined;
  if (hasCharge !== hasRate) {
    throw new HttpError(400, 'Wastewater standing charge and unit rate must both be set or both omitted');
  }
}

export function createUtilityTariff(input: CreateUtilityTariffInput): UtilityTariffDto {
  if (input.endDate !== undefined && input.endDate < input.startDate) {
    throw new HttpError(400, 'endDate cannot be before startDate');
  }
  const isWater = input.meterType === 'water';
  if (isWater) {
    validateWastewaterPairing(input);
  }

  const candidate = { startDate: input.startDate, endDate: input.endDate ?? null };
  const existingForMeter = tariffRepo.listUtilityTariffs().filter((t) => t.meterType === input.meterType);
  if (existingForMeter.some((t) => tariffsOverlap(t, candidate))) {
    throw new HttpError(409, `A ${input.meterType} tariff already covers part of this date range`);
  }

  const row = tariffRepo.insertUtilityTariff({
    meterType: input.meterType,
    providerName: input.providerName,
    startDate: input.startDate,
    endDate: input.endDate ?? null,
    standingChargePerDay: input.standingChargePerDay,
    unitRate: input.unitRate,
    wastewaterStandingChargePerDay: isWater ? input.wastewaterStandingChargePerDay ?? null : null,
    wastewaterUnitRate: isWater ? input.wastewaterUnitRate ?? null : null,
    rainwaterRemovalStandingChargePerDay: isWater ? input.rainwaterRemovalStandingChargePerDay ?? null : null,
    notes: input.notes ?? null,
  });
  return toTariffDto(row);
}

export function updateUtilityTariff(id: number, input: UpdateUtilityTariffInput): UtilityTariffDto {
  const existingRow = tariffRepo.getUtilityTariffById(id);
  if (!existingRow) {
    throw new HttpError(404, `Utility tariff ${id} not found`);
  }

  const meterType = (input.meterType ?? existingRow.meterType) as CreateUtilityTariffInput['meterType'];
  const startDate = input.startDate ?? existingRow.startDate;
  const endDate = input.endDate !== undefined ? input.endDate : existingRow.endDate ?? undefined;

  if (endDate !== undefined && endDate < startDate) {
    throw new HttpError(400, 'endDate cannot be before startDate');
  }

  const isWater = meterType === 'water';
  const wastewaterStandingChargePerDay =
    input.wastewaterStandingChargePerDay !== undefined
      ? input.wastewaterStandingChargePerDay
      : existingRow.wastewaterStandingChargePerDay ?? undefined;
  const wastewaterUnitRate =
    input.wastewaterUnitRate !== undefined ? input.wastewaterUnitRate : existingRow.wastewaterUnitRate ?? undefined;
  if (isWater) {
    validateWastewaterPairing({ wastewaterStandingChargePerDay, wastewaterUnitRate });
  }

  const candidate = { startDate, endDate: endDate ?? null };
  const otherTariffsForMeter = tariffRepo
    .listUtilityTariffs()
    .filter((t) => t.meterType === meterType && t.id !== id);
  if (otherTariffsForMeter.some((t) => tariffsOverlap(t, candidate))) {
    throw new HttpError(409, `A ${meterType} tariff already covers part of this date range`);
  }

  const rainwaterRemovalStandingChargePerDay =
    input.rainwaterRemovalStandingChargePerDay !== undefined
      ? input.rainwaterRemovalStandingChargePerDay
      : existingRow.rainwaterRemovalStandingChargePerDay ?? undefined;

  const row = tariffRepo.updateUtilityTariff(id, {
    ...(input.meterType !== undefined && { meterType: input.meterType }),
    ...(input.providerName !== undefined && { providerName: input.providerName }),
    ...(input.startDate !== undefined && { startDate: input.startDate }),
    ...(input.endDate !== undefined && { endDate: input.endDate ?? null }),
    ...(input.standingChargePerDay !== undefined && { standingChargePerDay: input.standingChargePerDay }),
    ...(input.unitRate !== undefined && { unitRate: input.unitRate }),
    wastewaterStandingChargePerDay: isWater ? wastewaterStandingChargePerDay ?? null : null,
    wastewaterUnitRate: isWater ? wastewaterUnitRate ?? null : null,
    rainwaterRemovalStandingChargePerDay: isWater ? rainwaterRemovalStandingChargePerDay ?? null : null,
    ...(input.notes !== undefined && { notes: input.notes ?? null }),
  });
  return toTariffDto(row as NonNullable<typeof row>);
}

export function deleteUtilityTariff(id: number): void {
  const deleted = tariffRepo.deleteUtilityTariff(id);
  if (!deleted) {
    throw new HttpError(404, `Utility tariff ${id} not found`);
  }
}

function toTariffPeriod(row: UtilityTariffRow): TariffPeriod {
  return {
    startDate: row.startDate,
    endDate: row.endDate,
    standingChargePerDay: row.standingChargePerDay,
    unitRate: row.unitRate,
    wastewaterStandingChargePerDay: row.wastewaterStandingChargePerDay,
    wastewaterUnitRate: row.wastewaterUnitRate,
    rainwaterRemovalStandingChargePerDay: row.rainwaterRemovalStandingChargePerDay,
  };
}

/**
 * Always computes against the full reading/tariff history (never a
 * year-filtered subset) and only slices/aggregates the *output* by year - a
 * reading pair spanning a year boundary needs both readings to prorate the
 * split correctly. Tariff rates are real pounds; the returned totals are
 * rounded to integer pence so `formatMoney` keeps working unchanged.
 */
export function getUtilityCostSeries(query: UtilityCostSeriesQuery): UtilityCostSeriesDto {
  const allReadings = repo.listEnergyReadings();
  const allTariffs = tariffRepo.listUtilityTariffs();
  const granularity: 'month' | 'year' = query.year !== undefined ? 'month' : 'year';

  const seriesByMeter: Record<MeterType, Map<string, number>> = {
    electricity: new Map(),
    gas: new Map(),
    water: new Map(),
  };

  for (const meterType of METER_TYPES) {
    const readingsForMeter: MeterReadingPoint[] = allReadings
      .filter((r) => r.meterType === meterType)
      .map((r) => ({
        readingDate: r.readingDate,
        value:
          meterType === 'water' ? normalizeWaterUsageToM3(r.value, r.unit as EnergyUnit) : r.value,
      }));
    const tariffsForMeter = allTariffs.filter((t) => t.meterType === meterType).map(toTariffPeriod);
    const monthly = costCalculation.calculateMonthlyCosts(readingsForMeter, tariffsForMeter, meterType);

    if (granularity === 'month') {
      for (const point of monthly) {
        if (point.month.startsWith(String(query.year))) {
          seriesByMeter[meterType].set(point.month, Math.round(point.cost * 100));
        }
      }
    } else {
      for (const point of costCalculation.aggregateToYears(monthly)) {
        seriesByMeter[meterType].set(point.year, Math.round(point.cost * 100));
      }
    }
  }

  const allPeriods = new Set<string>();
  for (const meterType of METER_TYPES) {
    for (const period of seriesByMeter[meterType].keys()) {
      allPeriods.add(period);
    }
  }

  const points: UtilityCostPointDto[] = [...allPeriods].sort().map((period) => ({
    period,
    electricity: seriesByMeter.electricity.get(period) ?? 0,
    gas: seriesByMeter.gas.get(period) ?? 0,
    water: seriesByMeter.water.get(period) ?? 0,
  }));

  return { granularity, points };
}
