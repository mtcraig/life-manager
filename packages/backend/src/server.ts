import { buildFastifyApp } from './app';
import { env } from './config/env';
import { runMigrations } from './db/migrate';
import { stopAllWatchers, syncWatchers } from './modules/ingestion/watcher';
import { triggerCatchUpIngestForWatchedAccounts } from './modules/accounts/service';

export async function startServer() {
  runMigrations();
  syncWatchers();
  triggerCatchUpIngestForWatchedAccounts(); // fire-and-forget, doesn't block app.listen()

  const app = await buildFastifyApp();
  app.addHook('onClose', async () => {
    stopAllWatchers();
  });
  await app.listen({ port: env.PORT, host: '127.0.0.1' });
  return app;
}
