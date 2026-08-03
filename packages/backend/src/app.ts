import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { env } from './config/env';
import { registerCors } from './plugins/cors';
import { registerErrorHandler } from './plugins/errorHandler';
import { healthRoutes } from './modules/health/routes';
import { accountRoutes } from './modules/accounts/routes';
import { transactionRoutes } from './modules/transactions/routes';
import { ingestionRoutes } from './modules/ingestion/routes';
import { categoryRoutes } from './modules/categories/routes';
import { vendorRoutes } from './modules/vendors/routes';
import { categorisationRuleRoutes } from './modules/categorisation-rules/routes';
import { analyticsRoutes } from './modules/analytics/routes';
import { investmentRoutes } from './modules/investments/routes';
import { propertyRoutes } from './modules/properties/routes';
import { liabilityRoutes } from './modules/liabilities/routes';
import { projectionScenarioRoutes } from './modules/projection-scenarios/routes';
import { wealthRoutes } from './modules/wealth/routes';
import { insuranceRoutes } from './modules/insurance/routes';
import { budgetRoutes } from './modules/budgets/routes';
import { subscriptionRoutes } from './modules/subscriptions/routes';
import { forecastRoutes } from './modules/forecast/routes';
import { areaRoutes } from './modules/areas/routes';
import { contentsRoutes } from './modules/contents/routes';
import { energyRoutes } from './modules/energy/routes';
import { databaseRoutes } from './modules/database/routes';
import { systemRoutes } from './modules/system/routes';
import { appSettingsRoutes } from './modules/app-settings/routes';
import { jobRoutes } from './modules/jobs/routes';

export async function buildFastifyApp() {
  const app = Fastify({ logger: true });

  registerErrorHandler(app);
  await registerCors(app);
  // Database import uploads a raw .db file; other routes only ever receive JSON.
  await app.register(multipart, { limits: { fileSize: 200 * 1024 * 1024, files: 1 } });

  await app.register(healthRoutes, { prefix: '/api' });
  await app.register(accountRoutes, { prefix: '/api' });
  await app.register(transactionRoutes, { prefix: '/api' });
  await app.register(ingestionRoutes, { prefix: '/api' });
  await app.register(categoryRoutes, { prefix: '/api' });
  await app.register(vendorRoutes, { prefix: '/api' });
  await app.register(categorisationRuleRoutes, { prefix: '/api' });
  await app.register(analyticsRoutes, { prefix: '/api' });
  await app.register(investmentRoutes, { prefix: '/api' });
  await app.register(propertyRoutes, { prefix: '/api' });
  await app.register(liabilityRoutes, { prefix: '/api' });
  await app.register(projectionScenarioRoutes, { prefix: '/api' });
  await app.register(wealthRoutes, { prefix: '/api' });
  await app.register(insuranceRoutes, { prefix: '/api' });
  await app.register(budgetRoutes, { prefix: '/api' });
  await app.register(subscriptionRoutes, { prefix: '/api' });
  await app.register(forecastRoutes, { prefix: '/api' });
  await app.register(areaRoutes, { prefix: '/api' });
  await app.register(contentsRoutes, { prefix: '/api' });
  await app.register(energyRoutes, { prefix: '/api' });
  await app.register(databaseRoutes, { prefix: '/api' });
  await app.register(systemRoutes, { prefix: '/api' });
  await app.register(appSettingsRoutes, { prefix: '/api' });
  await app.register(jobRoutes, { prefix: '/api' });

  // Only set by the packaged desktop app; the Vite dev server owns `/` otherwise.
  if (env.STATIC_DIR) {
    const staticDir = env.STATIC_DIR;
    await app.register(fastifyStatic, { root: staticDir, wildcard: false });

    app.setNotFoundHandler((request, reply) => {
      if (request.raw.url?.startsWith('/api/')) {
        reply.status(404).send({ error: { message: 'Not Found', statusCode: 404 } });
        return;
      }
      // Client-side routing (react-router-dom) fallback for deep links.
      reply.type('text/html').send(readFileSync(join(staticDir, 'index.html')));
    });
  }

  return app;
}
