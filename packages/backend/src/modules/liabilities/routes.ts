import type { FastifyInstance } from 'fastify';
import { createLiabilitySchema, createValuationSchema } from '@life-manager/shared';
import { z } from 'zod';
import * as service from './service';

const idParamSchema = z.object({ id: z.coerce.number().int().positive() });
const listQuerySchema = z.object({ includeArchived: z.coerce.boolean().optional().default(false) });
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
}
