import type { FastifyInstance } from 'fastify';
import {
  annualBudgetProgressQuerySchema,
  budgetProgressQuerySchema,
  createBudgetSchema,
  updateBudgetSchema,
} from '@life-manager/shared';
import { z } from 'zod';
import * as service from './service';

const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

export async function budgetRoutes(app: FastifyInstance) {
  app.get('/budgets', async () => {
    return service.listBudgets();
  });

  app.get('/budgets/progress', async (request) => {
    const { date } = budgetProgressQuerySchema.parse(request.query);
    return service.getBudgetProgress(date);
  });

  app.get('/budgets/progress/annual', async (request) => {
    const { year } = annualBudgetProgressQuerySchema.parse(request.query);
    return service.getAnnualBudgetProgress(year);
  });

  app.get('/budgets/:id', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    return service.getBudget(id);
  });

  app.post('/budgets', async (request, reply) => {
    const input = createBudgetSchema.parse(request.body);
    const budget = service.createBudget(input);
    reply.status(201);
    return budget;
  });

  app.patch('/budgets/:id', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    const input = updateBudgetSchema.parse(request.body);
    return service.updateBudget(id, input);
  });

  app.delete('/budgets/:id', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    service.deleteBudget(id);
    reply.status(204);
  });
}
