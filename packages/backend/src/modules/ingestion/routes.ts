import type { FastifyInstance } from 'fastify';
import type { IngestionEventDto } from '@life-manager/shared';
import { z } from 'zod';
import { prepareIngestPlan, runIngestJob } from './ingestService';
import { listRecentIngestionEvents } from './eventsRepo';
import type { IngestionEventRow } from './eventsRepo';
import * as jobsRepo from '../jobs/repo';

const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

function toDto(row: IngestionEventRow): IngestionEventDto {
  return {
    id: row.id,
    accountId: row.accountId,
    source: row.source as IngestionEventDto['source'],
    fileName: row.fileName,
    status: row.status as IngestionEventDto['status'],
    rowsIngested: row.rowsIngested,
    rowsSkipped: row.rowsSkipped,
    errorMessage: row.errorMessage,
    ranAt: new Date(row.ranAt).toISOString(),
  };
}

export async function ingestionRoutes(app: FastifyInstance) {
  app.post('/accounts/:id/ingest', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const plan = prepareIngestPlan(id, 'manual');
    const job = jobsRepo.createJob('ingest', plan.totalNewRows);
    runIngestJob(job.id, plan).catch((error) => {
      jobsRepo.failJob(job.id, error instanceof Error ? error.message : String(error));
    });
    reply.status(202);
    return { jobId: job.id };
  });

  app.get('/ingestion-events', async () => {
    return listRecentIngestionEvents().map(toDto);
  });
}
