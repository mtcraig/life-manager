import type { FastifyInstance } from 'fastify';
import { bulkImportEnergyReadingsSchema, createEnergyReadingSchema } from '@life-manager/shared';
import { z } from 'zod';
import * as service from './service';

const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

export async function energyRoutes(app: FastifyInstance) {
  app.get('/energy-readings', async () => {
    return service.listEnergyReadings();
  });

  app.post('/energy-readings', async (request, reply) => {
    const input = createEnergyReadingSchema.parse(request.body);
    const reading = service.createEnergyReading(input);
    reply.status(201);
    return reading;
  });

  app.post('/energy-readings/bulk-import', async (request) => {
    const input = bulkImportEnergyReadingsSchema.parse(request.body);
    return service.bulkImportEnergyReadings(input.csvContent);
  });

  app.delete('/energy-readings/:id', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    service.deleteEnergyReading(id);
    reply.status(204);
  });
}
