import { buildFastifyApp } from './app';
import { env } from './config/env';
import { runMigrations } from './db/migrate';
import { stopAllWatchers, syncWatchers } from './modules/ingestion/watcher';

async function main() {
  runMigrations();
  syncWatchers();

  const app = await buildFastifyApp();
  app.addHook('onClose', async () => {
    stopAllWatchers();
  });
  await app.listen({ port: env.PORT, host: '127.0.0.1' });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
