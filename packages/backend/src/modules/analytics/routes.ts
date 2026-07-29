import type { FastifyInstance } from 'fastify';
import { accountBalanceTrendQuerySchema, moneyFlowQuerySchema } from '@life-manager/shared';
import * as service from './service';

export async function analyticsRoutes(app: FastifyInstance) {
  app.get('/analytics/money-flow', async (request) => {
    const query = moneyFlowQuerySchema.parse(request.query);
    return service.getMoneyFlow(query);
  });

  app.get('/analytics/account-balance-trend', async (request) => {
    const query = accountBalanceTrendQuerySchema.parse(request.query);
    return service.getAccountBalanceTrend(query);
  });
}
