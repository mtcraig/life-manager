# Life Manager

A local-only personal finance dashboard: accounts, transactions, wealth, investments,
insurance, energy usage, and household contents in one place. Everything runs on your
own machine — no data ever leaves the local network.

## Architecture

- `packages/shared` — DTOs and Zod schemas shared between backend and frontend.
- `packages/backend` — Fastify API, SQLite (via `better-sqlite3` + Drizzle ORM).
- `packages/frontend` — Vite + React + Tailwind CSS, talking to the backend over `/api`.

## Prerequisites

- Node.js 20+
- npm 10+ (this repo uses npm workspaces — no other tooling required)

## Setup

```bash
npm install
npm run db:migrate --workspace=@life-manager/backend
npm run db:seed --workspace=@life-manager/backend
```

`db:migrate` creates the SQLite database (see **Data storage** below) and applies the
schema. `db:seed` adds starter data: a "Transfer" category, default contents areas, and
common transaction categories.

## Running the app

Start the backend and frontend in two terminals:

```bash
npm run dev:backend
npm run dev:frontend
```

- Backend: http://127.0.0.1:4000 (configurable — see **Configuration**)
- Frontend: http://127.0.0.1:5173, proxies `/api` requests to the backend

Open the frontend URL in your browser.

## Configuration

The backend reads its configuration from environment variables (all optional, with
sensible defaults for local use):

| Variable      | Default                        | Purpose                                   |
| ------------- | ------------------------------- | ------------------------------------------ |
| `PORT`        | `4000`                          | Port the Fastify API listens on            |
| `DB_PATH`     | `./data/life-manager.db`        | Path to the SQLite database file           |
| `CORS_ORIGIN` | `http://localhost:5173`         | Origin allowed to call the API (the Vite dev server) |

Set these in your shell, or in a `.env` file loaded before `npm run dev:backend` if you
prefer.

## Data storage — read this before relying on the app

SQLite is the **real, persistent store** for everything in this app — not a disposable
cache. The database file lives at `packages/backend/data/life-manager.db` by default
(controlled by `DB_PATH`), and it is the only copy of your data. It is gitignored on
purpose, because it contains your personal financial data and must never be committed.

**Back this file up yourself**, the same way you'd back up any other important personal
file — e.g. include `packages/backend/data/` in whatever backup tool or sync folder you
already use. There is no automatic backup built into the app.

To reset to a clean, empty-but-seeded database (for testing or starting over):

```bash
rm -rf packages/backend/data
npm run db:migrate --workspace=@life-manager/backend
npm run db:seed --workspace=@life-manager/backend
```

This is destructive — it deletes all accounts, transactions, investments, and every
other record you've entered. Only run it if you mean to discard the current data (after
backing it up, if you want to keep it).

## Ingesting transactions

Each account is configured for either **manual** ingestion (click "Ingest now" in
Settings → Accounts after dropping a CSV export somewhere) or a **watched folder**
(any CSV file placed in the configured folder is picked up automatically). Column
mapping (which CSV columns are date/description/amount) is configured per account,
since bank export formats vary by institution.

Energy readings use a fixed CSV format instead (`meterType,readingDate,value,unit,notes`)
since that's the app's own internal format, not a bank export — see the Energy page for
a bulk-paste importer.

## Development

```bash
npm run lint   # eslint across all packages
npm run test   # vitest across all packages
npm run build  # type-check + build all packages
```
