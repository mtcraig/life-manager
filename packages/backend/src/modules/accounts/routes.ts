import type { FastifyInstance } from 'fastify';
import { createAccountSchema, updateAccountSchema } from '@life-manager/shared';
import { z } from 'zod';
import * as service from './service';

const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

export async function accountRoutes(app: FastifyInstance) {
  app.get('/accounts', async () => {
    return service.listAccounts();
  });

  app.get('/accounts/:id', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    return service.getAccount(id);
  });

  app.post('/accounts', async (request, reply) => {
    const input = createAccountSchema.parse(request.body);
    const account = service.createAccount(input);
    reply.status(201);
    return account;
  });

  app.patch('/accounts/:id', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    const input = updateAccountSchema.parse(request.body);
    return service.updateAccount(id, input);
  });

  app.delete('/accounts/:id', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    service.deleteAccount(id);
    reply.status(204);
  });
}
