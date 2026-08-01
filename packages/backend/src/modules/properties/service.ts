import { parse } from 'csv-parse/sync';
import type {
  BulkImportValuationsResultDto,
  CreatePropertyInput,
  CreateValuationInput,
  PropertyDto,
  UpdateValuationInput,
  ValuationDto,
} from '@life-manager/shared';
import { HttpError } from '../../lib/httpError';
import { geocodeAddress } from './geocode';
import * as repo from './repo';
import type { PropertyRow, ValuationRow } from './repo';

function toDto(row: PropertyRow, currentValue: number | null): PropertyDto {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    notes: row.notes,
    lat: row.lat,
    lng: row.lng,
    archivedAt: row.archivedAt ? new Date(row.archivedAt).toISOString() : null,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
    currentValue,
  };
}

function valuationToDto(row: ValuationRow): ValuationDto {
  return {
    id: row.id,
    entityId: row.propertyId,
    asOfDate: row.asOfDate,
    value: row.value,
    notes: row.notes,
    createdAt: new Date(row.createdAt).toISOString(),
  };
}

export function listProperties(includeArchived: boolean): PropertyDto[] {
  const rows = repo.listProperties(includeArchived);
  const latestValues = repo.listLatestValuationsForAll();
  return rows.map((row) => toDto(row, latestValues.get(row.id) ?? null));
}

export function getProperty(id: number): PropertyDto {
  const row = repo.getPropertyById(id);
  if (!row) {
    throw new HttpError(404, `Property ${id} not found`);
  }
  const latestValues = repo.listLatestValuationsForAll();
  return toDto(row, latestValues.get(id) ?? null);
}

export async function createProperty(input: CreatePropertyInput): Promise<PropertyDto> {
  const coords = input.address ? await geocodeAddress(input.address) : null;
  const row = repo.insertProperty({
    name: input.name,
    address: input.address ?? null,
    notes: input.notes ?? null,
    lat: coords?.lat ?? null,
    lng: coords?.lng ?? null,
  });
  return toDto(row, null);
}

export async function updateProperty(
  id: number,
  input: Partial<CreatePropertyInput>,
): Promise<PropertyDto> {
  if (!repo.getPropertyById(id)) {
    throw new HttpError(404, `Property ${id} not found`);
  }
  const coords = input.address ? await geocodeAddress(input.address) : null;
  const row = repo.updateProperty(id, {
    ...(input.name !== undefined && { name: input.name }),
    ...(input.address !== undefined && { address: input.address ?? null, lat: coords?.lat ?? null, lng: coords?.lng ?? null }),
    ...(input.notes !== undefined && { notes: input.notes ?? null }),
  });
  const latestValues = repo.listLatestValuationsForAll();
  return toDto(row as NonNullable<typeof row>, latestValues.get(id) ?? null);
}

export function archiveProperty(id: number): PropertyDto {
  const row = repo.archiveProperty(id);
  if (!row) {
    throw new HttpError(404, `Property ${id} not found`);
  }
  const latestValues = repo.listLatestValuationsForAll();
  return toDto(row, latestValues.get(id) ?? null);
}

export function deleteProperty(id: number): void {
  if (!repo.getPropertyById(id)) {
    throw new HttpError(404, `Property ${id} not found`);
  }
  repo.deleteProperty(id);
}

export function listValuations(propertyId: number): ValuationDto[] {
  if (!repo.getPropertyById(propertyId)) {
    throw new HttpError(404, `Property ${propertyId} not found`);
  }
  return repo.listValuations(propertyId).map(valuationToDto);
}

export function addValuation(propertyId: number, input: CreateValuationInput): ValuationDto {
  if (!repo.getPropertyById(propertyId)) {
    throw new HttpError(404, `Property ${propertyId} not found`);
  }
  try {
    const row = repo.insertValuation(propertyId, {
      asOfDate: input.asOfDate,
      value: input.value,
      notes: input.notes ?? null,
    });
    return valuationToDto(row);
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      throw new HttpError(409, `A valuation for ${input.asOfDate} already exists`);
    }
    throw error;
  }
}

export function updateValuation(
  propertyId: number,
  valuationId: number,
  input: UpdateValuationInput,
): ValuationDto {
  if (!repo.getValuationById(propertyId, valuationId)) {
    throw new HttpError(404, `Valuation ${valuationId} not found for property ${propertyId}`);
  }
  try {
    const row = repo.updateValuation(propertyId, valuationId, {
      ...(input.asOfDate !== undefined && { asOfDate: input.asOfDate }),
      ...(input.value !== undefined && { value: input.value }),
      ...(input.notes !== undefined && { notes: input.notes ?? null }),
    });
    return valuationToDto(row as NonNullable<typeof row>);
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      throw new HttpError(409, `A valuation for ${input.asOfDate} already exists`);
    }
    throw error;
  }
}

export function deleteValuation(propertyId: number, valuationId: number): void {
  if (!repo.getValuationById(propertyId, valuationId)) {
    throw new HttpError(404, `Valuation ${valuationId} not found for property ${propertyId}`);
  }
  repo.deleteValuation(propertyId, valuationId);
}

/**
 * Bulk-paste CSV import of a spreadsheet's existing valuation history
 * (entityName,asOfDate,value,notes — see the schema comment in
 * shared/dto/valued-entity.ts). Properties referenced by name are created on
 * the fly if they don't already exist (with no address, so no geocode lookup
 * happens here — mirrors bulkImportRules' lookup-or-create for categories/vendors).
 */
export function bulkImportValuations(csvContent: string): BulkImportValuationsResultDto {
  const records: Record<string, string>[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  let valuationsCreated = 0;
  let entitiesCreated = 0;

  for (const row of records) {
    const entityName = row.entityName;
    const asOfDate = row.asOfDate;
    const rawValue = row.value;
    const notes = row.notes;
    if (!entityName || !asOfDate || !rawValue) {
      throw new HttpError(
        400,
        `CSV row missing required column(s) (entityName,asOfDate,value): ${JSON.stringify(row)}`,
      );
    }
    const value = Math.round(Number(rawValue) * 100);
    if (Number.isNaN(value)) {
      throw new HttpError(400, `Invalid numeric value "${rawValue}" for "${entityName}" on ${asOfDate}`);
    }

    let property = repo.getPropertyByName(entityName);
    if (!property) {
      property = repo.insertProperty({ name: entityName, address: null, notes: null, lat: null, lng: null });
      entitiesCreated += 1;
    }

    try {
      repo.insertValuation(property.id, {
        asOfDate,
        value,
        notes: notes && notes.length > 0 ? notes : null,
      });
      valuationsCreated += 1;
    } catch (error) {
      if (!(error instanceof Error && error.message.includes('UNIQUE constraint failed'))) {
        throw error;
      }
    }
  }

  return { valuationsCreated, entitiesCreated };
}
