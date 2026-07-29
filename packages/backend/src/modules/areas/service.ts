import type { AreaDto, CreateAreaInput } from '@life-manager/shared';
import { HttpError } from '../../lib/httpError';
import * as repo from './repo';
import type { AreaRow } from './repo';

function toDto(row: AreaRow): AreaDto {
  return {
    id: row.id,
    name: row.name,
    createdAt: new Date(row.createdAt).toISOString(),
  };
}

export function listAreas(): AreaDto[] {
  return repo.listAreas().map(toDto);
}

export function createArea(input: CreateAreaInput): AreaDto {
  try {
    return toDto(repo.insertArea(input.name));
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      throw new HttpError(409, `An area named "${input.name}" already exists`);
    }
    throw error;
  }
}

export function deleteArea(id: number): void {
  try {
    const deleted = repo.deleteArea(id);
    if (!deleted) {
      throw new HttpError(404, `Area ${id} not found`);
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('FOREIGN KEY constraint failed')) {
      throw new HttpError(409, `Area ${id} is still in use by one or more contents items`);
    }
    throw error;
  }
}
