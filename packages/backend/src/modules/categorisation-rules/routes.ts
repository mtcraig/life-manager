import type { FastifyInstance } from 'fastify';
import {
  bulkImportRulesSchema,
  createCategorisationRuleSchema,
  updateCategorisationRuleSchema,
} from '@life-manager/shared';
import { z } from 'zod';
import * as service from './service';

const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

export async function categorisationRuleRoutes(app: FastifyInstance) {
  app.get('/categorisation-rules', async () => {
    return service.listRules();
  });

  app.post('/categorisation-rules', async (request, reply) => {
    const input = createCategorisationRuleSchema.parse(request.body);
    const result = service.createRule(input);
    reply.status(201);
    return result;
  });

  app.patch('/categorisation-rules/:id', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    const input = updateCategorisationRuleSchema.parse(request.body);
    return service.updateRule(id, input);
  });

  app.delete('/categorisation-rules/:id', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    service.deleteRule(id);
    reply.status(204);
  });

  app.post('/categorisation-rules/bulk-import', async (request) => {
    const input = bulkImportRulesSchema.parse(request.body);
    return service.bulkImportRules(input);
  });

  app.post('/categorisation-rules/recategorise', async () => {
    return service.recategoriseUncategorised();
  });
}
