# Local web app with SQLite as the persistent store

We're building this as a local web app (backend API + browser frontend, reachable only on localhost/LAN) rather than a packaged desktop app, because it's simpler to build and review while still guaranteeing data never leaves the network. SQLite is the single persistent store for all application data; CSV files (transactions, energy usage, and bulk category-lookup loads) are one of several ingestion paths into it, not a rebuildable source of truth for everything — data with no CSV origin (investments, insurance, contents, wealth assumptions, and in-app additions to the category lookup) is entered directly and lives in SQLite as its only copy, so the database file itself must be backed up/carried between machines.

## Considered Options

- **Packaged desktop app (Electron/Tauri)** — rejected: more build/packaging complexity for a single technical user, with no real security or "standalone-ness" benefit over a localhost-only web app.
- **Fully disposable SQLite** (rebuild everything from flat files, nothing durable in the DB) — rejected: several domains (investments, insurance, contents, wealth assumptions) have no CSV/flat-file source at all, so this would require inventing and maintaining a second flat-file storage format for no real benefit.
