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
  external: [
    'fastify',
    '@fastify/cors',
    '@fastify/multipart',
    '@fastify/static',
    'better-sqlite3',
    'chokidar',
    'csv-parse',
    'drizzle-orm',
    'fuse.js',
    'zod',
  ],
  outfile: join(outDir, 'index.cjs'),
  logLevel: 'info',
});

// runMigrations() resolves its migrations folder relative to this file's own
// location at runtime (import.meta.url) - esbuild only bundles JS/TS, so the
// actual .sql migration files have to be copied alongside the bundle by hand.
cpSync(join(backendSrc, 'db', 'migrations'), join(outDir, 'migrations'), { recursive: true });
