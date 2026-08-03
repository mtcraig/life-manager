import type { FastifyInstance } from 'fastify';
import { forecastQuerySchema } from '@life-manager/shared';
import * as service from './service';

export async function forecastRoutes(app: FastifyInstance) {
  app.get('/forecast', async (request) => {
    const { accountId, horizonDays } = forecastQuerySchema.parse(request.query);
    return service.getForecast(accountId, horizonDays);
  });
}
