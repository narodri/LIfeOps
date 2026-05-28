import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { and, eq, gt } from "drizzle-orm";
import { nanoid } from "nanoid";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { CARD_PERIODS, CARD_STATUSES, COMPASS_NOTE_TYPES, THEMES } from "@lifeops/shared";
import { db, schema } from "./db.js";

const appPassword = process.env.LIFEOPS_PASSWORD;
if (!appPassword) throw new Error("LIFEOPS_PASSWORD is required");

const app = new Hono();
const isProd = process.env.NODE_ENV === "production";
const SESSION_MS = 30 * 24 * 3600 * 1000;
const uploadDir = process.env.LIFEOPS_UPLOAD_DIR ?? "./uploads";

const loginSchema = z.object({ password: z.string().min(1) });
const createCardSchema = z.object({ title: z.string().trim().min(1), period: z.enum(CARD_PERIODS), theme: z.enum(THEMES) });
const patchCardSchema = z.object({
  title: z.string().trim().min(1).optional(),
  period: z.enum(CARD_PERIODS).optional(),
  theme: z.enum(THEMES).optional(),
  status: z.enum(CARD_STATUSES).optional(),
  deadline: z.string().nullable().optional(),
  detailMemo: z.string().nullable().optional()
}).refine((v) => Object.keys(v).length > 0, { message: "empty patch" });
const memoSchema = z.object({ body: z.string().trim().min(1).max(300) });
const goalsSchema = z.array(z.object({ title: z.string().trim().min(1) })).max(3);
const compassPatchSchema = z.object({ threeMonthDirection: z.string() });
const noteCreateSchema = z.object({ type: z.enum(COMPASS_NOTE_TYPES), body: z.string().trim().min(1), enabled: z.boolean().optional() });
const notePatchSchema = z.object({ body: z.string().trim().min(1).optional(), enabled: z.boolean().optional() }).refine(v=>Object.keys(v).length>0);
const settingsPatchSchema = z.object({ primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(), accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional() }).refine(v=>Object.keys(v).length>0);

async function ensureSingletons() {
  const now = Date.now();
  await db.insert(schema.compass).values({ id: "singleton", threeMonthDirection: "", updatedAt: now }).onConflictDoNothing();
  await db.insert(schema.userSettings).values({ id: "singleton", backgroundImagePath: null, primaryColor: "#2563eb", accentColor: "#10b981", createdAt: now, updatedAt: now }).onConflictDoNothing();
}

const authMw = async (c: any, next: any) => {
  const token = getCookie(c, "lifeops_session");
  if (!token) return c.json({ error: "Unauthorized" }, 401);
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const [session] = await db.select().from(schema.sessions).where(and(eq(schema.sessions.tokenHash, tokenHash), gt(schema.sessions.expiresAt, Date.now())));
  if (!session) return c.json({ error: "Unauthorized" }, 401);
  await next();
};

app.post("/api/auth/login", async (c) => {
  const parsed = loginSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "Invalid" }, 401);

  const input = Buffer.from(parsed.data.password);
  const expected = Buffer.from(appPassword);
  const pass = input.length === expected.length && crypto.timingSafeEqual(input, expected);
  if (!pass) return c.json({ error: "Invalid" }, 401);

  const token = nanoid(48);
  const now = Date.now();
  await db.insert(schema.sessions).values({ id: nanoid(), tokenHash: crypto.createHash("sha256").update(token).digest("hex"), createdAt: now, expiresAt: now + SESSION_MS });
  setCookie(c, "lifeops_session", token, { httpOnly: true, secure: isProd, sameSite: "lax", maxAge: 30 * 24 * 3600, path: "/" });
  return c.json({ ok: true });
});

app.post("/api/auth/logout", authMw, async (c) => {
  const token = getCookie(c, "lifeops_session")!;
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  await db.delete(schema.sessions).where(eq(schema.sessions.tokenHash, hash));
  deleteCookie(c, "lifeops_session", { path: "/" });
  return c.json({ ok: true });
});
app.get("/api/auth/me", authMw, (c) => c.json({ ok: true }));

app.get("/api/cards", authMw, async (c) => c.json(await db.select().from(schema.cards)));
app.post("/api/cards", authMw, async (c) => {
  const parsed = createCardSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "bad request" }, 400);
  const now = Date.now();
  const card = { id: nanoid(), ...parsed.data, status: "Todo", deadline: null, detailMemo: null, createdAt: now, updatedAt: now, lastProgressMemoAt: null } as const;
  await db.insert(schema.cards).values(card);
  return c.json(card);
});
app.patch("/api/cards/:id", authMw, async (c) => {
  const parsed = patchCardSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "bad request" }, 400);
  await db.update(schema.cards).set({ ...parsed.data, updatedAt: Date.now() }).where(eq(schema.cards.id, c.req.param("id")));
  const [card] = await db.select().from(schema.cards).where(eq(schema.cards.id, c.req.param("id")));
  return c.json(card ?? null, card ? 200 : 404);
});
app.delete("/api/cards/:id", authMw, async (c) => { await db.delete(schema.cards).where(eq(schema.cards.id, c.req.param("id"))); return c.json({ ok: true }); });

app.get("/api/cards/:id/progress-memos", authMw, async (c) => c.json(await db.select().from(schema.progressMemos).where(eq(schema.progressMemos.cardId, c.req.param("id")))));
app.post("/api/cards/:id/progress-memos", authMw, async (c) => {
  const cardId = c.req.param("id");
  const parsed = memoSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "bad request" }, 400);
  const [card] = await db.select().from(schema.cards).where(eq(schema.cards.id, cardId));
  if (!card) return c.json({ error: "card not found" }, 404);

  const now = Date.now();
  const memo = { id: nanoid(), cardId, body: parsed.data.body, createdAt: now };
  db.transaction((tx) => {
    tx.insert(schema.progressMemos).values(memo).run();
    tx.update(schema.cards).set({ lastProgressMemoAt: now, updatedAt: now }).where(eq(schema.cards.id, cardId)).run();
  });

  return c.json(memo);
});

app.get("/api/long-term-goals", authMw, async (c) => c.json(await db.select().from(schema.longTermGoals)));
app.put("/api/long-term-goals", authMw, async (c) => {
  const parsed = goalsSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "bad request" }, 400);
  const now = Date.now();
  db.transaction((tx) => {
    tx.delete(schema.longTermGoals).run();
    for (const [i, g] of parsed.data.entries()) {
      tx.insert(schema.longTermGoals).values({ id: nanoid(), title: g.title, order: i, createdAt: now, updatedAt: now }).run();
    }
  });
  return c.json(await db.select().from(schema.longTermGoals));
});

app.get("/api/compass", authMw, async (c) => { await ensureSingletons(); const [row] = await db.select().from(schema.compass).where(eq(schema.compass.id, "singleton")); return c.json(row); });
app.patch("/api/compass", authMw, async (c) => {
  const parsed = compassPatchSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "bad request" }, 400);
  await ensureSingletons();
  await db.update(schema.compass).set({ threeMonthDirection: parsed.data.threeMonthDirection, updatedAt: Date.now() }).where(eq(schema.compass.id, "singleton"));
  return c.json({ ok: true });
});

app.get("/api/compass-notes", authMw, async (c) => c.json(await db.select().from(schema.compassNotes)));
app.post("/api/compass-notes", authMw, async (c) => {
  const parsed = noteCreateSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "bad request" }, 400);
  const now = Date.now();
  const row = { id: nanoid(), type: parsed.data.type, body: parsed.data.body, enabled: parsed.data.enabled ?? true, createdAt: now, updatedAt: now };
  await db.insert(schema.compassNotes).values(row);
  return c.json(row);
});
app.patch("/api/compass-notes/:id", authMw, async (c) => {
  const parsed = notePatchSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "bad request" }, 400);
  await db.update(schema.compassNotes).set({ ...parsed.data, updatedAt: Date.now() }).where(eq(schema.compassNotes.id, c.req.param("id")));
  return c.json({ ok: true });
});
app.delete("/api/compass-notes/:id", authMw, async (c) => { await db.delete(schema.compassNotes).where(eq(schema.compassNotes.id, c.req.param("id"))); return c.json({ ok: true }); });

app.get("/api/settings", authMw, async (c) => { await ensureSingletons(); const [row] = await db.select().from(schema.userSettings).where(eq(schema.userSettings.id, "singleton")); return c.json(row); });
app.patch("/api/settings", authMw, async (c) => {
  const parsed = settingsPatchSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "bad request" }, 400);
  await ensureSingletons();
  await db.update(schema.userSettings).set({ ...parsed.data, updatedAt: Date.now() }).where(eq(schema.userSettings.id, "singleton"));
  return c.json({ ok: true });
});

app.post("/api/settings/background", authMw, async (c) => {
  const body = await c.req.parseBody();
  const file = body.file;
  if (!(file instanceof File)) return c.json({ error: "file required" }, 400);
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) return c.json({ error: "unsupported type" }, 400);
  if (file.size > 5 * 1024 * 1024) return c.json({ error: "file too large" }, 400);

  fs.mkdirSync(uploadDir, { recursive: true });
  const ext = file.type === "image/png" ? ".png" : file.type === "image/webp" ? ".webp" : ".jpg";
  const fileName = `background${ext}`;
  fs.writeFileSync(path.join(uploadDir, fileName), Buffer.from(await file.arrayBuffer()));

  await ensureSingletons();
  await db.update(schema.userSettings).set({ backgroundImagePath: fileName, updatedAt: Date.now() }).where(eq(schema.userSettings.id, "singleton"));
  return c.json({ path: `/uploads/${fileName}` });
});

app.get("/uploads/:name", authMw, async (c) => {
  const safe = path.basename(c.req.param("name"));
  const full = path.join(uploadDir, safe);
  if (!fs.existsSync(full)) return c.json({ error: "not found" }, 404);
  const data = fs.readFileSync(full);
  const ext = path.extname(safe);
  const type = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
  return new Response(data, { headers: { "content-type": type } });
});

app.use("/assets/*", serveStatic({ root: "./apps/web/dist" }));
app.get("*", serveStatic({ path: "./apps/web/dist/index.html" }));

serve({ fetch: app.fetch, port: Number(process.env.PORT ?? 8787) });
