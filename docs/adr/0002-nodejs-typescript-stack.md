# Node.js/TypeScript stack: Fastify + Drizzle, Vite + React

We're using a single language (TypeScript) across a separate frontend and backend, rather than Next.js or a Python component, because the user is most comfortable maintaining a Node.js codebase and has no existing Python logic worth preserving (the categorisation lookup was a spreadsheet, not code). Backend: Fastify with `better-sqlite3` and Drizzle ORM for SQLite access. Frontend: Vite + React, with Recharts for standard charts and a dedicated calendar-heatmap component for the Home page's daily money in/out view.

## Considered Options

- **Next.js** (combined frontend/backend, file-based routing) — rejected: the user is more familiar with, and prefers, a separate frontend/backend split over a full-stack meta-framework.
- **Express** instead of Fastify — rejected in favor of Fastify's built-in TypeScript-friendly schema validation, at low cost since the user's Express familiarity transfers directly.
- **Prisma** instead of Drizzle — rejected: Drizzle's thinner, more SQL-like API and lack of codegen step better suit the "detailed, reviewable code" goal.
