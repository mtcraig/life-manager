import type {
  ContentsItemDto,
  CreateContentsItemInput,
  UpdateContentsItemInput,
} from '@life-manager/shared';
import { HttpError } from '../../lib/httpError';
import * as repo from './repo';
import type { ContentsItemRow } from './repo';

function toDto(row: ContentsItemRow): ContentsItemDto {
  return {
    id: row.id,
    name: row.name,
    areaId: row.areaId,
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
