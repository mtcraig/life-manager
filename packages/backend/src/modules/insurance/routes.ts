import type { FastifyInstance } from 'fastify';
import { createInsurancePlanSchema, updateInsurancePlanSchema } from '@life-manager/shared';
import { z } from 'zod';
import * as service from './service';

const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

export async function insuranceRoutes(app: FastifyInstance) {
  app.get('/insurance-plans', async () => {
    return service.listInsurancePlans();
  });

  app.get('/insurance-plans/:id', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    return service.getInsurancePlan(id);
  });

  app.post('/insurance-plans', async (request, reply) => {
    const input = createInsurancePlanSchema.parse(request.body);
    const plan = service.createInsurancePlan(input);
    reply.status(201);
    return plan;
  });

  app.patch('/insurance-plans/:id', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    const input = updateInsurancePlanSchema.parse(request.body);
    return service.updateInsurancePlan(id, input);
  });

  app.delete('/insurance-plans/:id', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    service.deleteInsurancePlan(id);
    reply.status(204);
  });

  app.post('/insurance-plans/:id/cancel', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    return service.cancelInsurancePlan(id);
  });
}
