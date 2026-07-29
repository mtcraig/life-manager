import type { FastifyInstance } from 'fastify';
import type { HealthCheckDto } from '@life-manager/shared';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async (): Promise<HealthCheckDto> => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });
}
