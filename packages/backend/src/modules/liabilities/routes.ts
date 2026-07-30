import type { FastifyInstance } from 'fastify';
import {
  createLiabilitySchema,
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
// See properties/routes.ts for why this isn't z.coerce.boolean().
const listQuerySchema = z.object({
  includeArchived: z
    .string()
    .optional()
    .transform((value) => value === 'true'),
});
const updateLiabilitySchema = createLiabilitySchema.partial();

export async function liabilityRoutes(app: FastifyInstance) {
  app.get('/liabilities', async (request) => {
    const { includeArchived } = listQuerySchema.parse(request.query);
    return service.listLiabilities(includeArchived);
  });

  app.get('/liabilities/:id', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    return service.getLiability(id);
  });

  app.post('/liabilities', async (request, reply) => {
    const input = createLiabilitySchema.parse(request.body);
    const liability = service.createLiability(input);
    reply.status(201);
    return liability;
  });

  app.patch('/liabilities/:id', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    const input = updateLiabilitySchema.parse(request.body);
    return service.updateLiability(id, input);
  });

  app.post('/liabilities/:id/archive', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    return service.archiveLiability(id);
  });

  app.delete('/liabilities/:id', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    service.deleteLiability(id);
    reply.status(204);
  });

  app.get('/liabilities/:id/valuations', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    return service.listValuations(id);
  });

  app.post('/liabilities/:id/valuations', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const input = createValuationSchema.parse(request.body);
    const valuation = service.addValuation(id, input);
    reply.status(201);
    return valuation;
  });

  app.patch('/liabilities/:id/valuations/:valuationId', async (request) => {
    const { id, valuationId } = valuationParamSchema.parse(request.params);
    const input = updateValuationSchema.parse(request.body);
    return service.updateValuation(id, valuationId, input);
  });

  app.delete('/liabilities/:id/valuations/:valuationId', async (request, reply) => {
    const { id, valuationId } = valuationParamSchema.parse(request.params);
    service.deleteValuation(id, valuationId);
    reply.status(204);
  });
}
