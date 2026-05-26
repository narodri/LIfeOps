import { serve } from '@hono/node-server';
import { Hono } from 'hono';

const app = new Hono();

app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'lifeops-backend' });
});

const port = Number(process.env.PORT ?? 3000);

serve({
  fetch: app.fetch,
  port,
});

console.log(`LifeOps backend listening on http://localhost:${port}`);
