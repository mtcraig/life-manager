import type {
  CreatePropertyInput,
  CreateValuationInput,
  PropertyDto,
  ValuationDto,
} from '@life-manager/shared';
import { HttpError } from '../../lib/httpError';
import * as repo from './repo';
import type { PropertyRow, ValuationRow } from './repo';

function toDto(row: PropertyRow, currentValue: number | null): PropertyDto {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    notes: row.notes,
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

export function createProperty(input: CreatePropertyInput): PropertyDto {
  const row = repo.insertProperty({
    name: input.name,
    address: input.address ?? null,
    notes: input.notes ?? null,
  });
  return toDto(row, null);
}

export function updateProperty(id: number, input: Partial<CreatePropertyInput>): PropertyDto {
  if (!repo.getPropertyById(id)) {
    throw new HttpError(404, `Property ${id} not found`);
  }
  const row = repo.updateProperty(id, {
    ...(input.name !== undefined && { name: input.name }),
    ...(input.address !== undefined && { address: input.address ?? null }),
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
