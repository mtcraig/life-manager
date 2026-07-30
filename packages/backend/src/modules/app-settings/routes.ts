import type { FastifyInstance } from 'fastify';
import { updateAppSettingsSchema } from '@life-manager/shared';
import * as service from './service';

export async function appSettingsRoutes(app: FastifyInstance) {
  app.get('/app-settings', async () => {
    return service.getAppSettings();
  });

  app.put('/app-settings', async (request) => {
    const input = updateAppSettingsSchema.parse(request.body);
    return service.updateAppSettings(input);
  });
}
