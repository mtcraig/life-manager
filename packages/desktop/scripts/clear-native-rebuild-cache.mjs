import { existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// electron-builder's internal rebuild step (@electron/rebuild) writes a
// `.forge-meta` marker (e.g. "x64--130") into better-sqlite3's build/Release
// directory once it believes it has rebuilt the module for a given
// arch/ABI, and trusts that marker instead of re-checking the actual binary
// on future runs. If anything else replaces the binary afterward without
// clearing the marker - e.g. `npm rebuild better-sqlite3` at the repo root,
// which the desktop README's caveat says is needed to restore the dev
// workflow - the marker goes stale: the next packaging run sees a
// (now-wrong) cache hit, skips the real rebuild, logs "finished" as if it
// succeeded, and ships a binary still built for system Node's ABI instead
// of Electron's. Deleting the marker before every packaging run forces a
// real check against the binary that's actually on disk.
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const forgeMeta = join(
  repoRoot,
  'node_modules',
  'better-sqlite3',
  'build',
  'Release',
  '.forge-meta',
);

if (existsSync(forgeMeta)) {
  rmSync(forgeMeta);
}
