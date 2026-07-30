import Fastify from 'fastify';
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
  await app.register(areaRoutes, { prefix: '/api' });
  await app.register(contentsRoutes, { prefix: '/api' });
  await app.register(energyRoutes, { prefix: '/api' });
  await app.register(databaseRoutes, { prefix: '/api' });
  await app.register(systemRoutes, { prefix: '/api' });
  await app.register(appSettingsRoutes, { prefix: '/api' });
  await app.register(jobRoutes, { prefix: '/api' });

  return app;
}
