import type { FastifyInstance } from 'fastify';
import {
  bulkImportContentsItemsSchema,
  createContentsItemSchema,
  updateContentsItemSchema,
} from '@life-manager/shared';
import { z } from 'zod';
import * as service from './service';

const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

export async function contentsRoutes(app: FastifyInstance) {
  app.get('/contents-items', async () => {
    return service.listContentsItems();
  });

  app.post('/contents-items', async (request, reply) => {
    const input = createContentsItemSchema.parse(request.body);
    const item = service.createContentsItem(input);
    reply.status(201);
    return item;
  });

  app.patch('/contents-items/:id', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    const input = updateContentsItemSchema.parse(request.body);
    return service.updateContentsItem(id, input);
  });

  app.delete('/contents-items/:id', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    service.deleteContentsItem(id);
    reply.status(204);
  });

  app.post('/contents-items/bulk-import', async (request) => {
    const input = bulkImportContentsItemsSchema.parse(request.body);
    return service.bulkImportContentsItems(input.csvContent);
  });
}
