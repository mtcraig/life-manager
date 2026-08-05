import { parse } from 'csv-parse/sync';
import type {
  BulkImportContentsItemsResultDto,
  ContentsItemDto,
  CreateContentsItemInput,
  UpdateContentsItemInput,
} from '@life-manager/shared';
import { HttpError } from '../../lib/httpError';
import { normalizeCsvHeaders } from '../../lib/csv';
import * as areasRepo from '../areas/repo';
import * as propertiesRepo from '../properties/repo';
import * as repo from './repo';
import type { ContentsItemRow } from './repo';

function toDto(row: ContentsItemRow): ContentsItemDto {
  return {
    id: row.id,
    name: row.name,
    areaId: row.areaId,
    propertyId: row.propertyId,
    value: row.value,
    purchaseDate: row.purchaseDate,
    notes: row.notes,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

export function listContentsItems(): ContentsItemDto[] {
  return repo.listContentsItems().map(toDto);
}

export function createContentsItem(input: CreateContentsItemInput): ContentsItemDto {
  const row = repo.insertContentsItem({
    name: input.name,
    areaId: input.areaId,
    propertyId: input.propertyId,
    value: input.value,
    purchaseDate: input.purchaseDate ?? null,
    notes: input.notes ?? null,
  });
  return toDto(row);
}

export function updateContentsItem(id: number, input: UpdateContentsItemInput): ContentsItemDto {
  if (!repo.getContentsItemById(id)) {
    throw new HttpError(404, `Contents item ${id} not found`);
  }
  const row = repo.updateContentsItem(id, {
    ...(input.name !== undefined && { name: input.name }),
    ...(input.areaId !== undefined && { areaId: input.areaId }),
    ...(input.propertyId !== undefined && { propertyId: input.propertyId }),
    ...(input.value !== undefined && { value: input.value }),
    ...(input.purchaseDate !== undefined && { purchaseDate: input.purchaseDate ?? null }),
    ...(input.notes !== undefined && { notes: input.notes ?? null }),
  });
  return toDto(row as NonNullable<typeof row>);
}

export function deleteContentsItem(id: number): void {
  const deleted = repo.deleteContentsItem(id);
  if (!deleted) {
    throw new HttpError(404, `Contents item ${id} not found`);
  }
}

/**
 * Bulk-paste CSV import of an existing contents inventory spreadsheet
 * (name,area,property,value,purchaseDate,notes — see the schema comment in
 * shared/dto/contents-item.ts). Areas referenced by name are created on the
 * fly if they don't already exist, mirroring bulkImportRules' lookup-or-create
 * approach for categories/vendors. Properties are looked up only (never
 * created — see the DTO comment for why), falling back to the top active
 * property when the column is blank/omitted.
 */
export function bulkImportContentsItems(csvContent: string): BulkImportContentsItemsResultDto {
  const records: Record<string, string>[] = parse(csvContent, {
    columns: normalizeCsvHeaders(['name', 'area', 'property', 'value', 'purchaseDate', 'notes']),
    skip_empty_lines: true,
    trim: true,
  });

  let itemsCreated = 0;
  let areasCreated = 0;

  for (const row of records) {
    const name = row.name;
    const areaName = row.area;
    const propertyName = row.property;
    const rawValue = row.value;
    const purchaseDate = row.purchaseDate;
    const notes = row.notes;
    if (!name || !areaName || !rawValue) {
      throw new HttpError(
        400,
        `CSV row missing required column(s) (name,area,value): ${JSON.stringify(row)}`,
      );
    }
    const value = Math.round(Number(rawValue) * 100);
    if (Number.isNaN(value)) {
      throw new HttpError(400, `Invalid numeric value "${rawValue}" for "${name}"`);
    }

    let area = areasRepo.getAreaByName(areaName);
    if (!area) {
      area = areasRepo.insertArea(areaName);
      areasCreated += 1;
    }

    let propertyId: number;
    if (propertyName && propertyName.length > 0) {
      const property = propertiesRepo.getPropertyByName(propertyName);
      if (!property) {
        throw new HttpError(400, `Unknown property "${propertyName}" — create it on the Wealth page first`);
      }
      propertyId = property.id;
    } else {
      const [topProperty] = propertiesRepo.listProperties(false);
      if (!topProperty) {
        throw new HttpError(
          400,
          'No active property exists to default to — add one on the Wealth page first, or include a "property" column',
        );
      }
      propertyId = topProperty.id;
    }

    repo.insertContentsItem({
      name,
      areaId: area.id,
      propertyId,
      value,
      purchaseDate: purchaseDate && purchaseDate.length > 0 ? purchaseDate : null,
      notes: notes && notes.length > 0 ? notes : null,
    });
    itemsCreated += 1;
  }

  return { itemsCreated, areasCreated };
}
