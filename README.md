# LifeOps MVP

## Required env
- `LIFEOPS_PASSWORD` (required)
- `LIFEOPS_DB_PATH` (example: `/data/lifeops.db`)
- `LIFEOPS_UPLOAD_DIR` (example: `/data/uploads`)
- `PORT` (default 8787)

## Local run
```bash
npm install
npm --workspace @lifeops/api run db:migrate
npm run dev
```

## Type check / tests
```bash
npm run typecheck
npm run test
```

## Fly.io deploy
1. Create and attach volume to `/data`.
2. Set secrets/env including `LIFEOPS_PASSWORD`.
3. Ensure:
   - `LIFEOPS_DB_PATH=/data/lifeops.db`
   - `LIFEOPS_UPLOAD_DIR=/data/uploads`
4. Deploy with `fly deploy`.
