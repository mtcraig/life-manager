import type { FastifyInstance } from 'fastify';
import * as service from './service';

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
}
