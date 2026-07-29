import type { FastifyInstance } from 'fastify';
import * as service from './service';

export async function wealthRoutes(app: FastifyInstance) {
  app.get('/wealth', async () => {
    return service.getWealthSummary();
  });
}
