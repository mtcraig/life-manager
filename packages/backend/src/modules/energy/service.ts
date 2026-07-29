import { parse } from 'csv-parse/sync';
import { ENERGY_UNITS, METER_TYPES } from '@life-manager/shared';
import type {
  BulkImportEnergyReadingsResultDto,
  CreateEnergyReadingInput,
  EnergyReadingDto,
} from '@life-manager/shared';
import { HttpError } from '../../lib/httpError';
import * as repo from './repo';
import type { EnergyReadingRow } from './repo';

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
    columns: true,
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
