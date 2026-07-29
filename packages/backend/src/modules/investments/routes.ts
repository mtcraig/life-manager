import type { FastifyInstance } from 'fastify';
import { createInvestmentSchema, createValuationSchema } from '@life-manager/shared';
import { z } from 'zod';
import * as service from './service';

const idParamSchema = z.object({ id: z.coerce.number().int().positive() });
const listQuerySchema = z.object({ includeArchived: z.coerce.boolean().optional().default(false) });
const updateInvestmentSchema = createInvestmentSchema.partial();

export async function investmentRoutes(app: FastifyInstance) {
  app.get('/investments', async (request) => {
    const { includeArchived } = listQuerySchema.parse(request.query);
    return service.listInvestments(includeArchived);
  });

  app.get('/investments/:id', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    return service.getInvestment(id);
  });

  app.post('/investments', async (request, reply) => {
    const input = createInvestmentSchema.parse(request.body);
    const investment = service.createInvestment(input);
    reply.status(201);
    return investment;
  });

  app.patch('/investments/:id', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    const input = updateInvestmentSchema.parse(request.body);
    return service.updateInvestment(id, input);
  });

  app.post('/investments/:id/archive', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    return service.archiveInvestment(id);
  });

  app.get('/investments/:id/valuations', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    return service.listValuations(id);
  });

  app.post('/investments/:id/valuations', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const input = createValuationSchema.parse(request.body);
    const valuation = service.addValuation(id, input);
    reply.status(201);
    return valuation;
  });
}
