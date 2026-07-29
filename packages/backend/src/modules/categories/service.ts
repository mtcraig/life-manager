import type { CategoryDto, CreateCategoryInput } from '@life-manager/shared';
import { HttpError } from '../../lib/httpError';
import * as repo from './repo';
import type { CategoryRow } from './repo';

function toDto(row: CategoryRow): CategoryDto {
  return {
    id: row.id,
    name: row.name,
    isTransfer: row.isTransfer,
    kind: row.kind,
    color: row.color,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

export function listCategories(): CategoryDto[] {
  return repo.listCategories().map(toDto);
}

export function createCategory(input: CreateCategoryInput): CategoryDto {
  try {
    const row = repo.insertCategory({
      name: input.name,
      isTransfer: input.isTransfer,
      kind: input.kind ?? null,
      color: input.color ?? null,
    });
    return toDto(row);
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      throw new HttpError(409, `A category named "${input.name}" already exists`);
    }
    throw error;
  }
}
