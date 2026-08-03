import type { FastifyInstance } from 'fastify';
import {
  transactionExportQuerySchema,
  transactionListQuerySchema,
  updateTransactionCategorySchema,
  updateTransactionVendorSchema,
} from '@life-manager/shared';
import { z } from 'zod';
import * as service from './service';

const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

export async function transactionRoutes(app: FastifyInstance) {
  app.get('/transactions', async (request) => {
    const query = transactionListQuerySchema.parse(request.query);
    return service.listTransactions(query);
  });

  app.get('/transactions/export', async (request, reply) => {
    const query = transactionExportQuerySchema.parse(request.query);
    const csv = service.exportTransactionsCsv(query);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="transactions-export-${timestamp}.csv"`)
      .send(csv);
  });

  app.patch('/transactions/:id', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    const input = updateTransactionCategorySchema.parse(request.body);
    return service.updateTransactionCategory(id, input);
  });

  app.patch('/transactions/:id/vendor', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    const input = updateTransactionVendorSchema.parse(request.body);
    return service.updateTransactionVendor(id, input);
  });
}
