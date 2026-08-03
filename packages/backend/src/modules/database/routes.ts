import type { FastifyInstance } from 'fastify';
import * as service from './service';
import { HttpError } from '../../lib/httpError';

export async function databaseRoutes(app: FastifyInstance) {
  app.get('/database/backup', async (request, reply) => {
    const buffer = service.backupDatabase();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    reply
      .header('Content-Type', 'application/octet-stream')
      .header('Content-Disposition', `attachment; filename="life-manager-backup-${timestamp}.db"`)
      .send(buffer);
  });

  app.post('/database/reset', async (request, reply) => {
    service.resetDatabase();
    reply.status(204);
  });

  app.post('/database/import', async (request, reply) => {
    const data = await request.file();
    if (!data) {
      throw new HttpError(400, 'No file was uploaded.');
    }

    let buffer: Buffer;
    try {
      buffer = await data.toBuffer();
    } catch {
      throw new HttpError(413, 'The uploaded file is too large.');
    }
    if (data.file.truncated) {
      throw new HttpError(413, 'The uploaded file is too large.');
    }

    service.importDatabase(buffer);
    reply.status(204);
  });
}
