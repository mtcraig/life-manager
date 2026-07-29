import type { FastifyInstance } from 'fastify';
import { createPropertySchema, createValuationSchema } from '@life-manager/shared';
import { z } from 'zod';
import * as service from './service';

const idParamSchema = z.object({ id: z.coerce.number().int().positive() });
const listQuerySchema = z.object({ includeArchived: z.coerce.boolean().optional().default(false) });
const updatePropertySchema = createPropertySchema.partial();

export async function propertyRoutes(app: FastifyInstance) {
  app.get('/properties', async (request) => {
    const { includeArchived } = listQuerySchema.parse(request.query);
    return service.listProperties(includeArchived);
  });

  app.get('/properties/:id', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    return service.getProperty(id);
  });

  app.post('/properties', async (request, reply) => {
    const input = createPropertySchema.parse(request.body);
    const property = service.createProperty(input);
    reply.status(201);
    return property;
  });

  app.patch('/properties/:id', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    const input = updatePropertySchema.parse(request.body);
    return service.updateProperty(id, input);
  });

  app.post('/properties/:id/archive', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    return service.archiveProperty(id);
  });

  app.get('/properties/:id/valuations', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    return service.listValuations(id);
  });

  app.post('/properties/:id/valuations', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const input = createValuationSchema.parse(request.body);
    const valuation = service.addValuation(id, input);
    reply.status(201);
    return valuation;
  });
}
