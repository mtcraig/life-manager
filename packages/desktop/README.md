# @life-manager/desktop

Packages the app as a standalone Windows desktop app (Electron). This is a
separate distribution channel from the source-checkout dev workflow
(`start.bat` / `npm run dev:backend` + `dev:frontend`) - neither depends on
the other for code or data, though see the native module caveat below for one
real interaction between them.

## How it works

- The Fastify backend (`packages/backend/src/server.ts`) is bundled with
  esbuild into a single CJS file and run **in-process** inside Electron's main
  process - no child process, no separate terminal windows.
- The built frontend (`packages/frontend/dist`, from
  `npm run build --workspace=@life-manager/frontend`) is copied in and served
  by the backend itself via `@fastify/static` (set via `STATIC_DIR`).
- The database lives in the OS per-user app-data directory
  (`app.getPath('userData')`, i.e. `%APPDATA%/life-manager/life-manager.db`),
  not next to the app.
- Closing the window is the only quit path: it calls `app.quit()`, which
  triggers `fastifyApp.close()` before the process exits.

## Development

```sh
npm install
npm start                   # bundles the backend, packages an unpacked build, and launches it
```

`npm start` goes through a real (but fast) `electron-builder --dir` packaging
step rather than running `electron .` directly against source - see the native
module caveat below for why - then launches the resulting
`release/win-unpacked/Life Manager.exe`.

## Building an installer

```sh
npm run dist                # produces an NSIS installer and a portable .exe in ./release
```

## Known caveats

- **Native module ABI, and why `npm start` packages instead of running
  `electron .` directly**: `better-sqlite3` has to be rebuilt against
  Electron's Node ABI before it'll load inside Electron. The standalone
  commands meant for this (`electron-rebuild`, `electron-builder
  install-app-deps`) proved unreliable while building this package - they
  report success without actually producing an Electron-compatible binary.
  Only running the real packaging pipeline (`electron-builder --win`, or
  `--dir` for the fast unpacked-only version `npm start` uses) reliably
  rebuilds it correctly, which is why `npm start` goes through `--dir`
  packaging rather than `electron .` against source.
  **This rebuild happens in place on the repo-root `node_modules`** (npm
  workspaces hoist `better-sqlite3` there), so running `npm start` or `npm run
  dist` leaves it built for Electron's ABI, not system Node's - the regular
  backend dev workflow (`npm run dev:backend`, `npm test`) will fail with a
  `NODE_MODULE_VERSION mismatch` error immediately afterward. Run `npm rebuild
  better-sqlite3` from the repo root to restore it. This doesn't affect CI,
  since each release build runs in a disposable checkout that's never reused
  for anything else.
- **The rebuild step caches its own result, and that cache can lie**:
  electron-builder's internal rebuild writes a `.forge-meta` marker (e.g.
  `x64--130`) into `better-sqlite3`'s `build/Release` directory once it
  believes it has rebuilt the module for a given arch/ABI, and on later runs
  trusts that marker instead of re-checking the binary that's actually on
  disk. Running `npm rebuild better-sqlite3` at the repo root (the previous
  caveat) replaces the binary with a system-Node one but has no reason to know
  about or clear this marker - so the *next* packaging run sees a stale cache
  hit, skips the real rebuild, logs `finished` as if it worked, and ships a
  binary still built for system Node's ABI. This was the cause of the
  packaged app failing to open at all after a `npm rebuild better-sqlite3` in
  between packaging runs. `prepare:resources` now runs
  `scripts/clear-native-rebuild-cache.mjs` before every packaging step, which
  deletes that marker so the rebuild can never trust stale state - this is no
  longer something you need to think about, just documented here as the
  reason that script exists.
- **`prepare:resources` rebuilds the frontend too**: it runs
  `npm run build --workspace=@life-manager/frontend` before copying
  `packages/frontend/dist` in, so a stale, previously-built `dist` folder from
  before a frontend change can't silently get repackaged.
- **Dependency versions are duplicated, not shared**: this package declares
  its own copies of the backend's runtime dependencies instead of relying on
  the hoisted workspace `node_modules`, so that `electron-builder` can package
  a self-contained `node_modules` without resolving monorepo symlinks. When
  bumping a shared dependency (`fastify`, `better-sqlite3`, `drizzle-orm`,
  etc.) in `packages/backend/package.json`, bump the matching entry here too.
- **No icon yet** - see `assets/README.md`.
