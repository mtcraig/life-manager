import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().min(0).default(4000),
  DB_PATH: z.string().default('./data/life-manager.db'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  // Set by the packaged desktop app to the built frontend's static assets;
  // left unset in dev, where the Vite dev server owns `/` instead.
  STATIC_DIR: z.string().optional(),
});

export const env = envSchema.parse(process.env);
