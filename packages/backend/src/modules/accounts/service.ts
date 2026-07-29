import type { AccountDto, CreateAccountInput, UpdateAccountInput } from '@life-manager/shared';
import { HttpError } from '../../lib/httpError';
import { syncWatchers } from '../ingestion/watcher';
import * as repo from './repo';
import type { AccountRow } from './repo';

function toDto(row: AccountRow): AccountDto {
  return {
    id: row.id,
    name: row.name,
    type: row.type as AccountDto['type'],
    institution: row.institution,
    ingestionMode: row.ingestionMode as AccountDto['ingestionMode'],
    folderPath: row.folderPath,
    columnMapping: row.columnMapping as AccountDto['columnMapping'],
    archivedAt: row.archivedAt ? new Date(row.archivedAt).toISOString() : null,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

export function listAccounts(includeArchived: boolean): AccountDto[] {
  return repo.listAccounts(includeArchived).map(toDto);
}

export function getAccount(id: number): AccountDto {
  const row = repo.getAccountById(id);
  if (!row) {
    throw new HttpError(404, `Account ${id} not found`);
  }
  return toDto(row);
}

export function createAccount(input: CreateAccountInput): AccountDto {
  try {
    const row = repo.insertAccount({
      name: input.name,
      type: input.type,
      institution: input.institution ?? null,
      ingestionMode: input.ingestionMode,
      folderPath: input.folderPath ?? null,
      columnMapping: input.columnMapping ?? null,
    });
    syncWatchers();
    return toDto(row);
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      throw new HttpError(409, `An account named "${input.name}" already exists`);
    }
    throw error;
  }
}

export function updateAccount(id: number, input: UpdateAccountInput): AccountDto {
  if (!repo.getAccountById(id)) {
    throw new HttpError(404, `Account ${id} not found`);
  }

  const row = repo.updateAccount(id, {
    ...(input.name !== undefined && { name: input.name }),
    ...(input.type !== undefined && { type: input.type }),
    ...(input.institution !== undefined && { institution: input.institution ?? null }),
    ...(input.ingestionMode !== undefined && { ingestionMode: input.ingestionMode }),
    ...(input.folderPath !== undefined && { folderPath: input.folderPath ?? null }),
    ...(input.columnMapping !== undefined && { columnMapping: input.columnMapping ?? null }),
  });
  syncWatchers();
  return toDto(row as NonNullable<typeof row>);
}

export function archiveAccount(id: number): AccountDto {
  const row = repo.archiveAccount(id);
  if (!row) {
    throw new HttpError(404, `Account ${id} not found`);
  }
  syncWatchers();
  return toDto(row);
}
