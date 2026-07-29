import type { FastifyInstance } from 'fastify';
import { createAccountSchema, updateAccountSchema } from '@life-manager/shared';
import { z } from 'zod';
import * as service from './service';

const idParamSchema = z.object({ id: z.coerce.number().int().positive() });
const listQuerySchema = z.object({ includeArchived: z.coerce.boolean().optional().default(false) });

export async function accountRoutes(app: FastifyInstance) {
  app.get('/accounts', async (request) => {
    const { includeArchived } = listQuerySchema.parse(request.query);
    return service.listAccounts(includeArchived);
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

  app.post('/accounts/:id/archive', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    return service.archiveAccount(id);
  });
}
