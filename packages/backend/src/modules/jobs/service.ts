import type { JobDto } from '@life-manager/shared';
import { HttpError } from '../../lib/httpError';
import * as repo from './repo';
import type { JobRow } from './repo';

function toDto(row: JobRow): JobDto {
  return {
    id: row.id,
    kind: row.kind as JobDto['kind'],
    status: row.status as JobDto['status'],
    total: row.total,
    processed: row.processed,
    resultJson: row.resultJson,
    errorMessage: row.errorMessage,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

export function getJob(id: number): JobDto {
  const row = repo.getJobById(id);
  if (!row) {
    throw new HttpError(404, `Job ${id} not found`);
  }
  return toDto(row);
}
