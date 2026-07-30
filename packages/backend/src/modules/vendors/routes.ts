import type { FastifyInstance } from 'fastify';
import { createVendorSchema } from '@life-manager/shared';
import * as service from './service';

export async function vendorRoutes(app: FastifyInstance) {
  app.get('/vendors', async () => {
    return service.listVendors();
  });

  app.post('/vendors', async (request, reply) => {
    const input = createVendorSchema.parse(request.body);
    const vendor = service.createVendor(input);
    reply.status(201);
    return vendor;
  });
}
