# LifeOps MVP

## env
- LIFEOPS_PASSWORD
- LIFEOPS_DB_PATH (e.g. /data/lifeops.db)
- LIFEOPS_UPLOAD_DIR (e.g. /data/uploads)
- PORT

## run
npm install
npm --workspace @lifeops/api run db:migrate
npm run dev

## fly
- mount volume at /data
- set LIFEOPS_DB_PATH=/data/lifeops.db
- set LIFEOPS_UPLOAD_DIR=/data/uploads
