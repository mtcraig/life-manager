import type {
  CreateLiabilityInput,
  CreateValuationInput,
  LiabilityDto,
  UpdateValuationInput,
  ValuationDto,
} from '@life-manager/shared';
import { HttpError } from '../../lib/httpError';
import * as repo from './repo';
import type { LiabilityRow, ValuationRow } from './repo';

function toDto(row: LiabilityRow, currentValue: number | null): LiabilityDto {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
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
    entityId: row.liabilityId,
    asOfDate: row.asOfDate,
    value: row.value,
    notes: row.notes,
    createdAt: new Date(row.createdAt).toISOString(),
  };
}

export function listLiabilities(includeArchived: boolean): LiabilityDto[] {
  const rows = repo.listLiabilities(includeArchived);
  const latestValues = repo.listLatestValuationsForAll();
  return rows.map((row) => toDto(row, latestValues.get(row.id) ?? null));
}

export function getLiability(id: number): LiabilityDto {
  const row = repo.getLiabilityById(id);
  if (!row) {
    throw new HttpError(404, `Liability ${id} not found`);
  }
  const latestValues = repo.listLatestValuationsForAll();
  return toDto(row, latestValues.get(id) ?? null);
}

export function createLiability(input: CreateLiabilityInput): LiabilityDto {
  const row = repo.insertLiability({
    name: input.name,
    kind: input.kind ?? null,
    notes: input.notes ?? null,
  });
  return toDto(row, null);
}

export function updateLiability(id: number, input: Partial<CreateLiabilityInput>): LiabilityDto {
  if (!repo.getLiabilityById(id)) {
    throw new HttpError(404, `Liability ${id} not found`);
  }
  const row = repo.updateLiability(id, {
    ...(input.name !== undefined && { name: input.name }),
    ...(input.kind !== undefined && { kind: input.kind ?? null }),
    ...(input.notes !== undefined && { notes: input.notes ?? null }),
  });
  const latestValues = repo.listLatestValuationsForAll();
  return toDto(row as NonNullable<typeof row>, latestValues.get(id) ?? null);
}

export function archiveLiability(id: number): LiabilityDto {
  const row = repo.archiveLiability(id);
  if (!row) {
    throw new HttpError(404, `Liability ${id} not found`);
  }
  const latestValues = repo.listLatestValuationsForAll();
  return toDto(row, latestValues.get(id) ?? null);
}

export function deleteLiability(id: number): void {
  if (!repo.getLiabilityById(id)) {
    throw new HttpError(404, `Liability ${id} not found`);
  }
  repo.deleteLiability(id);
}

export function listValuations(liabilityId: number): ValuationDto[] {
  if (!repo.getLiabilityById(liabilityId)) {
    throw new HttpError(404, `Liability ${liabilityId} not found`);
  }
  return repo.listValuations(liabilityId).map(valuationToDto);
}

export function addValuation(liabilityId: number, input: CreateValuationInput): ValuationDto {
  if (!repo.getLiabilityById(liabilityId)) {
    throw new HttpError(404, `Liability ${liabilityId} not found`);
  }
  try {
    const row = repo.insertValuation(liabilityId, {
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
  liabilityId: number,
  valuationId: number,
  input: UpdateValuationInput,
): ValuationDto {
  if (!repo.getValuationById(liabilityId, valuationId)) {
    throw new HttpError(404, `Valuation ${valuationId} not found for liability ${liabilityId}`);
  }
  try {
    const row = repo.updateValuation(liabilityId, valuationId, {
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

export function deleteValuation(liabilityId: number, valuationId: number): void {
  if (!repo.getValuationById(liabilityId, valuationId)) {
    throw new HttpError(404, `Valuation ${valuationId} not found for liability ${liabilityId}`);
  }
  repo.deleteValuation(liabilityId, valuationId);
}
