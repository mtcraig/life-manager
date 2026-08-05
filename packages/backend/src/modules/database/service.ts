import { randomUUID } from 'node:crypto';
import { readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { sqlite } from '../../db/client';
import { runSeed } from '../../db/seed';
import { HttpError } from '../../lib/httpError';
import { stopAllWatchers, syncWatchers } from '../ingestion/watcher';

/** First 16 bytes of any valid SQLite database file. */
const SQLITE_HEADER = Buffer.from('SQLite format 3\0', 'utf8');

function listExpectedTables(): string[] {
  const rows = sqlite
    .prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '__drizzle_migrations'`,
    )
    .all() as { name: string }[];
  return rows.map((r) => r.name);
}

/**
 * A consistent, WAL-safe snapshot of the whole database as a Buffer, suitable
 * for sending straight back as a file download. Goes via `db.backup()` (SQLite's
 * own Online Backup API, through the live connection, so it always reflects
 * every committed write) to a scratch temp file rather than `sqlite.serialize()`
 * - `serialize()` hands back a Buffer wrapping memory allocated outside V8's
 * heap, which crashes the whole process with a V8 sandbox fatal error when
 * this backend runs inside Electron's main process (packaged desktop app only;
 * never reproduced in the plain Node dev server). Reading the temp file back
 * with `readFileSync` produces an ordinary V8-heap-backed Buffer instead.
 */
export async function backupDatabase(): Promise<Buffer> {
  const tempPath = join(tmpdir(), `life-manager-backup-${randomUUID()}.db`);
  try {
    await sqlite.backup(tempPath);
    return readFileSync(tempPath);
  } finally {
    try {
      unlinkSync(tempPath);
    } catch {
      // best-effort cleanup; a stray file in os.tmpdir() is harmless
    }
  }
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

  const tables = listExpectedTables();

  sqlite.pragma('foreign_keys = OFF'); // must be set outside any transaction
  const wipe = sqlite.transaction(() => {
    for (const name of tables) {
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

/**
 * Restores a previously downloaded backup (see `backupDatabase`), completely
 * replacing all current data. Never closes, deletes, or swaps the live file
 * handle (same Windows file-locking concern as `resetDatabase`) — instead the
 * uploaded bytes are written to a scratch temp file, `ATTACH`ed to the live
 * connection as a second schema, and copied across table-by-table in place.
 */
export function importDatabase(buffer: Buffer): void {
  if (buffer.length < 16 || !buffer.subarray(0, 16).equals(SQLITE_HEADER)) {
    throw new HttpError(400, 'The uploaded file is not a valid SQLite database.');
  }

  const tempPath = join(tmpdir(), `life-manager-import-${randomUUID()}.db`);
  writeFileSync(tempPath, buffer);

  let attached = false;
  try {
    try {
      sqlite.prepare('ATTACH DATABASE ? AS backup').run(tempPath);
      attached = true;
    } catch {
      throw new HttpError(400, 'The uploaded file could not be opened as a SQLite database.');
    }

    // Validate table shape before wiping anything — leaves current data
    // completely untouched if the file doesn't look like a real backup.
    const expectedTables = listExpectedTables();
    const backupTableNames = new Set(
      (sqlite.prepare(`SELECT name FROM backup.sqlite_master WHERE type='table'`).all() as { name: string }[]).map(
        (r) => r.name,
      ),
    );
    const missing = expectedTables.filter((t) => !backupTableNames.has(t));
    if (missing.length > 0) {
      throw new HttpError(400, `This file doesn't look like a Life Manager backup (missing tables: ${missing.join(', ')}).`);
    }

    // Everything below this line is destructive; only reached once both
    // validation checks above have passed.
    stopAllWatchers();
    try {
      sqlite.pragma('foreign_keys = OFF'); // must be set outside any transaction
      try {
        const doImport = sqlite.transaction(() => {
          for (const table of expectedTables) {
            // Column-name intersection rather than SELECT * — avoids
            // misaligned inserts if the two schemas ever diverge in column
            // order/count (e.g. a backup from an older app version).
            const liveColumns = (sqlite.pragma(`table_info("${table}")`) as { name: string }[]).map((c) => c.name);
            const backupColumns = new Set(
              (sqlite.pragma(`backup.table_info("${table}")`) as { name: string }[]).map((c) => c.name),
            );
            const columnList = liveColumns
              .filter((c) => backupColumns.has(c))
              .map((c) => `"${c}"`)
              .join(', ');

            sqlite.exec(`DELETE FROM "${table}"`);
            sqlite.exec(`INSERT INTO "${table}" (${columnList}) SELECT ${columnList} FROM backup."${table}"`);
          }

          // Re-copy AUTOINCREMENT counters explicitly rather than relying on
          // SQLite bumping them as a side effect of inserting explicit ids,
          // which doesn't reliably reproduce a backup's exact counter state.
          const hasBackupSequence = sqlite
            .prepare(`SELECT 1 FROM backup.sqlite_master WHERE type='table' AND name='sqlite_sequence'`)
            .get();
          sqlite.exec(`DELETE FROM sqlite_sequence`);
          if (hasBackupSequence) {
            sqlite.exec(`INSERT INTO sqlite_sequence SELECT * FROM backup.sqlite_sequence`);
          }

          // Safeguard against a corrupt/incompatible backup: throwing inside
          // a better-sqlite3 transaction callback triggers an automatic
          // rollback, so a bad import can't leave the app half-restored.
          const violations = sqlite.pragma('foreign_key_check');
          if (Array.isArray(violations) && violations.length > 0) {
            throw new Error(`backup data fails foreign key checks (${violations.length} violation(s))`);
          }
        });

        try {
          doImport();
        } catch (error) {
          throw new HttpError(
            400,
            `Import failed and was rolled back: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      } finally {
        sqlite.pragma('foreign_keys = ON');
      }
    } finally {
      // Whether the import succeeded or rolled back, the accounts table is
      // back to a known-good state — resync watchers against it either way.
      syncWatchers();
    }
  } finally {
    if (attached) {
      try {
        sqlite.exec('DETACH DATABASE backup');
      } catch {
        // best-effort; not fatal to leave detach unattempted if this throws
      }
    }
    try {
      unlinkSync(tempPath);
    } catch {
      // best-effort cleanup; a stray file in os.tmpdir() is harmless
    }
  }
}
