# LifeOps MVP Foundation

This repository contains the initial foundation for a **React + Vite frontend** and **Hono + TypeScript backend** with **SQLite + Drizzle**.

## Project structure

- `frontend/` – React app (Vite)
- `backend/` – Hono API server, Drizzle ORM, SQLite config/schema
- `shared/` – shared TypeScript types for frontend/backend contracts
- `docs/` – documentation space for upcoming MVP feature specs

## Local development

### 1) Install dependencies

```bash
npm install
```

### 2) Start frontend + backend together

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend health check: `http://localhost:3000/health`

### 3) Run only one service

```bash
npm run dev:frontend
npm run dev:backend
```

## Database (SQLite + Drizzle)

From the repository root:

```bash
npm run db:generate
npm run db:migrate
npm run db:studio
```

Database file: `backend/dev.db`
Schema source: `backend/src/db/schema.ts`
Drizzle config: `backend/drizzle.config.ts`

## Foundation scope completed

- Project structure
- Workspace/package scripts
- Shared types package
- Backend health check endpoint
- SQLite/Drizzle connection and config
- Initial schema (`users`, `goals`)
