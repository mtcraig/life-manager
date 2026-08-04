import { cpSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { rimrafSync } from 'rimraf';

const here = dirname(fileURLToPath(import.meta.url));
const desktopRoot = join(here, '..');
const backendSrc = join(desktopRoot, '..', 'backend', 'src');
const outDir = join(desktopRoot, 'resources', 'backend');

rimrafSync(outDir);
mkdirSync(outDir, { recursive: true });

await build({
  entryPoints: [join(backendSrc, 'server.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  // Real npm deps stay as require()s satisfied from this workspace's own
  // node_modules. Deliberately NOT `packages: 'external'`, which would also
  // externalize the workspace-linked `@life-manager/shared` - that package's
  // `main` field points at its raw TypeScript source (`./src/index.ts`),
  // which has no working plain-`require()` path (it uses `.js`-suffixed
  // relative imports resolved by tsx/tsc, not present as real files). Leaving
  // it un-externalized lets esbuild inline and transpile that source directly.
  // chokidar v5+ is ESM-only - Electron's bundled Node can't require() it
  // directly ("ERR_REQUIRE_ESM"), so it's deliberately left OFF this list and
  // inlined/transpiled into the bundle by esbuild instead, same reasoning as
  // @life-manager/shared above. fsevents is chokidar's optional macOS-only
  // native binding (guarded by a runtime platform check in chokidar's own
  // code) - it isn't installed on this Windows workspace, so it's kept
  // external purely so esbuild doesn't fail trying to resolve it at bundle
  // time; that require path never actually executes on Windows.
  external: [
    'fastify',
    '@fastify/cors',
    '@fastify/multipart',
    '@fastify/static',
    'better-sqlite3',
    'csv-parse',
    'drizzle-orm',
    'fuse.js',
    'zod',
    'fsevents',
  ],
  outfile: join(outDir, 'index.cjs'),
  logLevel: 'info',
});

// runMigrations() resolves its migrations folder relative to this file's own
// location at runtime (import.meta.url) - esbuild only bundles JS/TS, so the
// actual .sql migration files have to be copied alongside the bundle by hand.
cpSync(join(backendSrc, 'db', 'migrations'), join(outDir, 'migrations'), { recursive: true });
