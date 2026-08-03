import type { FastifyInstance } from 'fastify';
import { createSubscriptionSchema, updateSubscriptionSchema } from '@life-manager/shared';
import { z } from 'zod';
import * as service from './service';

const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

export async function subscriptionRoutes(app: FastifyInstance) {
  app.get('/subscriptions', async () => {
    return service.listSubscriptions();
  });

  app.get('/subscriptions/:id', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    return service.getSubscription(id);
  });

  app.post('/subscriptions', async (request, reply) => {
    const input = createSubscriptionSchema.parse(request.body);
    const subscription = service.createSubscription(input);
    reply.status(201);
    return subscription;
  });

  app.patch('/subscriptions/:id', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    const input = updateSubscriptionSchema.parse(request.body);
    return service.updateSubscription(id, input);
  });

  app.delete('/subscriptions/:id', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    service.deleteSubscription(id);
    reply.status(204);
  });

  app.post('/subscriptions/:id/cancel', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    return service.cancelSubscription(id);
  });
}
