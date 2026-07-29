import type { FastifyError, FastifyInstance } from 'fastify';
import { ZodError } from 'zod';

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error: FastifyError, _request, reply) => {
    if (error instanceof ZodError) {
      reply.status(400).send({
        error: {
          message: 'Validation failed',
          statusCode: 400,
          issues: error.issues,
        },
      });
      return;
    }

    const statusCode = error.statusCode ?? 500;
    app.log.error(error);
    reply.status(statusCode).send({
      error: {
        message: error.message,
        statusCode,
      },
    });
  });
}
