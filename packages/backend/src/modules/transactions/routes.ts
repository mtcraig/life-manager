import type { FastifyInstance } from 'fastify';
import { transactionListQuerySchema, updateTransactionCategorySchema } from '@life-manager/shared';
import { z } from 'zod';
import * as service from './service';

const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

export async function transactionRoutes(app: FastifyInstance) {
  app.get('/transactions', async (request) => {
    const query = transactionListQuerySchema.parse(request.query);
    return service.listTransactions(query);
  });

  app.patch('/transactions/:id', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    const input = updateTransactionCategorySchema.parse(request.body);
    return service.updateTransactionCategory(id, input);
  });
}
