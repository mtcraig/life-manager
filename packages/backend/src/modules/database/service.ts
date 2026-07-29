import { sqlite } from '../../db/client';
import { runSeed } from '../../db/seed';
import { stopAllWatchers, syncWatchers } from '../ingestion/watcher';

/**
 * A consistent, WAL-safe snapshot of the whole database as a Buffer, suitable
 * for streaming straight back as a file download. `serialize()` operates
 * through the live connection, so it always reflects every committed write
 * regardless of checkpoint state. The explicit checkpoint first is cheap
 * insurance, not strictly required.
 */
export function backupDatabase(): Buffer {
  sqlite.pragma('wal_checkpoint(TRUNCATE)');
  return sqlite.serialize();
}

/**
 * Wipes every table's rows in place (same open connection, same file — no
 * file deletion, which is what previously hit Windows file-locking issues)
 * then re-seeds to the same default state a fresh install starts in.
 */
export function resetDatabase(): void {
  // The accounts table is about to be wiped, so any active watched-folder
  // watcher would otherwise keep running against a since-deleted account.
  stopAllWatchers();

  const tables = sqlite
    .prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '__drizzle_migrations'`,
    )
    .all() as { name: string }[];

  sqlite.pragma('foreign_keys = OFF'); // must be set outside any transaction
  const wipe = sqlite.transaction(() => {
    for (const { name } of tables) {
      sqlite.exec(`DELETE FROM "${name}"`);
    }
    // AUTOINCREMENT guarantees ids are never reused, so without this they'd
    // keep climbing past a reset instead of restarting at 1.
    sqlite.exec(`DELETE FROM sqlite_sequence`);
  });
  wipe();
  sqlite.pragma('foreign_keys = ON');

  runSeed();
  syncWatchers(); // rebuilds the (now-empty) watcher set
}
