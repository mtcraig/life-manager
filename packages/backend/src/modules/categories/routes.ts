import type { FastifyInstance } from 'fastify';
import { createCategorySchema } from '@life-manager/shared';
import * as service from './service';

export async function categoryRoutes(app: FastifyInstance) {
  app.get('/categories', async () => {
    return service.listCategories();
  });

  app.post('/categories', async (request, reply) => {
    const input = createCategorySchema.parse(request.body);
    const category = service.createCategory(input);
    reply.status(201);
    return category;
  });
}
