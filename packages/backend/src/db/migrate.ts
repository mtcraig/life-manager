import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from './client';

export function runMigrations() {
  // The packaged desktop app bundles this file with esbuild, which empties
  // `import.meta.url` for CJS output - it sets MIGRATIONS_DIR itself instead,
  // pointing at the migrations folder copied alongside the bundle.
  const migrationsFolder =
    process.env.MIGRATIONS_DIR ?? fileURLToPath(new URL('./migrations', import.meta.url));
  migrate(db, { migrationsFolder });
}
