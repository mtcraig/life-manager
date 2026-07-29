import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from './client';

export function runMigrations() {
  const migrationsFolder = fileURLToPath(new URL('./migrations', import.meta.url));
  migrate(db, { migrationsFolder });
}
