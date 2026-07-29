import type { FastifyInstance } from 'fastify';
import { createAreaSchema } from '@life-manager/shared';
import { z } from 'zod';
import * as service from './service';

const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

export async function areaRoutes(app: FastifyInstance) {
  app.get('/areas', async () => {
    return service.listAreas();
  });

  app.post('/areas', async (request, reply) => {
    const input = createAreaSchema.parse(request.body);
    const area = service.createArea(input);
    reply.status(201);
    return area;
  });

  app.delete('/areas/:id', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    service.deleteArea(id);
    reply.status(204);
  });
}
