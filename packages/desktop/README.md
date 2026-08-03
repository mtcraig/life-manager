# @life-manager/desktop

Packages the app as a standalone Windows desktop app (Electron). This is a
separate distribution channel from the source-checkout dev workflow
(`start.bat` / `npm run dev:backend` + `dev:frontend`) - neither depends on
the other, and building/running this package never touches the other
workflow's files.

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
npm install                # also rebuilds better-sqlite3 for Electron's ABI
npm start                   # bundles the backend + copies the frontend, then launches Electron
```

## Building an installer

```sh
npm run dist                # produces an NSIS installer and a portable .exe in ./release
```

## Known caveats

- **Native module ABI**: `npm install` here rebuilds `better-sqlite3` against
  Electron's Node ABI via its `postinstall` script
  (`electron-rebuild -f -w better-sqlite3`). Because npm workspaces hoist
  `better-sqlite3` to the repo-root `node_modules`, this flips the hoisted copy
  to the wrong ABI for the regular backend dev workflow (`npm run dev:backend`,
  `npm test`) immediately afterward. If you hit a
  `NODE_MODULE_VERSION mismatch` error running the backend after working in
  this package, run `npm rebuild better-sqlite3` (or reinstall) from the repo
  root to restore it. This doesn't affect CI, since each release build runs in
  a disposable checkout.
- **Dependency versions are duplicated, not shared**: this package declares
  its own copies of the backend's runtime dependencies instead of relying on
  the hoisted workspace `node_modules`, so that `electron-builder` can package
  a self-contained `node_modules` without resolving monorepo symlinks. When
  bumping a shared dependency (`fastify`, `better-sqlite3`, `drizzle-orm`,
  etc.) in `packages/backend/package.json`, bump the matching entry here too.
- **No icon yet** - see `assets/README.md`.
