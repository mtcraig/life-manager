import type { FastifyInstance } from 'fastify';
import * as service from './service';

export async function systemRoutes(app: FastifyInstance) {
  app.post('/system/shutdown', async (request, reply) => {
    reply.status(202).send();
    service.shutdown();
  });
}
