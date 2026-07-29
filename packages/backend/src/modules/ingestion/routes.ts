import type { FastifyInstance } from 'fastify';
import type { IngestionEventDto } from '@life-manager/shared';
import { z } from 'zod';
import { ingestAccountFolder } from './ingestService';
import { listRecentIngestionEvents } from './eventsRepo';
import type { IngestionEventRow } from './eventsRepo';

const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

function toDto(row: IngestionEventRow): IngestionEventDto {
  return {
    id: row.id,
    accountId: row.accountId,
    source: row.source as IngestionEventDto['source'],
    fileName: row.fileName,
    status: row.status as IngestionEventDto['status'],
    rowsIngested: row.rowsIngested,
    errorMessage: row.errorMessage,
    ranAt: new Date(row.ranAt).toISOString(),
  };
}

export async function ingestionRoutes(app: FastifyInstance) {
  app.post('/accounts/:id/ingest', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    return ingestAccountFolder(id, 'manual');
  });

  app.get('/ingestion-events', async () => {
    return listRecentIngestionEvents().map(toDto);
  });
}
