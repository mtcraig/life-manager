import type { FastifyInstance } from 'fastify';
import {
  bulkImportEnergyReadingsSchema,
  createEnergyReadingSchema,
  createUtilityTariffSchema,
  updateUtilityTariffSchema,
  utilityCostSeriesQuerySchema,
} from '@life-manager/shared';
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

  app.get('/utility-tariffs', async () => {
    return service.listUtilityTariffs();
  });

  app.get('/utility-tariffs/:id', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    return service.getUtilityTariff(id);
  });

  app.post('/utility-tariffs', async (request, reply) => {
    const input = createUtilityTariffSchema.parse(request.body);
    const tariff = service.createUtilityTariff(input);
    reply.status(201);
    return tariff;
  });

  app.patch('/utility-tariffs/:id', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    const input = updateUtilityTariffSchema.parse(request.body);
    return service.updateUtilityTariff(id, input);
  });

  app.delete('/utility-tariffs/:id', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    service.deleteUtilityTariff(id);
    reply.status(204);
  });

  app.get('/energy-utility-costs', async (request) => {
    const query = utilityCostSeriesQuerySchema.parse(request.query);
    return service.getUtilityCostSeries(query);
  });

  app.get('/energy-meter-usage', async (request) => {
    const query = utilityCostSeriesQuerySchema.parse(request.query);
    return service.getMeterUsageSeries(query);
  });
}
