import type { FastifyInstance } from 'fastify';
import {
  accountBalanceTrendQuerySchema,
  categorySummaryQuerySchema,
  moneyFlowQuerySchema,
  topTransactionsQuerySchema,
  transactionDateBoundsQuerySchema,
} from '@life-manager/shared';
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

  app.get('/analytics/category-summary', async (request) => {
    const query = categorySummaryQuerySchema.parse(request.query);
    return service.getCategorySummary(query);
  });

  app.get('/analytics/category-summary-by-month', async (request) => {
    const query = categorySummaryQuerySchema.parse(request.query);
    return service.getCategorySummaryByMonth(query);
  });

  app.get('/analytics/top-transactions', async (request) => {
    const query = topTransactionsQuerySchema.parse(request.query);
    return service.getTopTransactions(query);
  });

  app.get('/analytics/transaction-date-bounds', async (request) => {
    const query = transactionDateBoundsQuerySchema.parse(request.query);
    return service.getTransactionDateBounds(query);
  });
}
