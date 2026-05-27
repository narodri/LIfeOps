FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY package.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm install

COPY . .
RUN npm run build

EXPOSE 8787
CMD ["sh", "-c", "npm --workspace @lifeops/api run db:migrate && node apps/api/dist/index.js"]
