/**
 * Thrown by services to signal a specific HTTP status. The Fastify error
 * handler (plugins/errorHandler.ts) reads `statusCode` off any thrown error.
 */
export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
