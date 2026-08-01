import type { FastifyInstance } from 'fastify';
import {
  bulkImportValuationsSchema,
  createPropertySchema,
  createValuationSchema,
  updateValuationSchema,
} from '@life-manager/shared';
import { z } from 'zod';
import * as service from './service';

const idParamSchema = z.object({ id: z.coerce.number().int().positive() });
const valuationParamSchema = z.object({
  id: z.coerce.number().int().positive(),
  valuationId: z.coerce.number().int().positive(),
});
// Not z.coerce.boolean() — that coerces via JS's Boolean(), so the string "false"
// (which the frontend always sends explicitly) becomes `true`, silently including
// archived rows in every "active only" list. Parse the literal string instead.
const listQuerySchema = z.object({
  includeArchived: z
    .string()
    .optional()
    .transform((value) => value === 'true'),
});
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
    const property = await service.createProperty(input);
    reply.status(201);
    return property;
  });

  app.patch('/properties/:id', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    const input = updatePropertySchema.parse(request.body);
    return await service.updateProperty(id, input);
  });

  app.post('/properties/:id/archive', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    return service.archiveProperty(id);
  });

  app.delete('/properties/:id', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    service.deleteProperty(id);
    reply.status(204);
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

  app.patch('/properties/:id/valuations/:valuationId', async (request) => {
    const { id, valuationId } = valuationParamSchema.parse(request.params);
    const input = updateValuationSchema.parse(request.body);
    return service.updateValuation(id, valuationId, input);
  });

  app.delete('/properties/:id/valuations/:valuationId', async (request, reply) => {
    const { id, valuationId } = valuationParamSchema.parse(request.params);
    service.deleteValuation(id, valuationId);
    reply.status(204);
  });

  app.post('/properties/bulk-import-valuations', async (request) => {
    const input = bulkImportValuationsSchema.parse(request.body);
    return service.bulkImportValuations(input.csvContent);
  });
}
