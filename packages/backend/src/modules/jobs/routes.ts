import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as service from './service';

const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

export async function jobRoutes(app: FastifyInstance) {
  app.get('/jobs/:id', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    return service.getJob(id);
  });
}
