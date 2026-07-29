import type { FastifyInstance } from 'fastify';
import {
  createProjectionScenarioSchema,
  updateProjectionScenarioSchema,
} from '@life-manager/shared';
import { z } from 'zod';
import * as service from './service';

const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

export async function projectionScenarioRoutes(app: FastifyInstance) {
  app.get('/projection-scenarios', async () => {
    return service.listScenarios();
  });

  app.get('/projection-scenarios/:id', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    return service.getScenario(id);
  });

  app.post('/projection-scenarios', async (request, reply) => {
    const input = createProjectionScenarioSchema.parse(request.body);
    const scenario = service.createScenario(input);
    reply.status(201);
    return scenario;
  });

  app.patch('/projection-scenarios/:id', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    const input = updateProjectionScenarioSchema.parse(request.body);
    return service.updateScenario(id, input);
  });

  app.delete('/projection-scenarios/:id', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    service.deleteScenario(id);
    reply.status(204);
  });

  app.get('/projection-scenarios/:id/projection', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    return service.computeProjection(id);
  });
}
