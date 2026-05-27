import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
const dbPath = process.env.LIFEOPS_DB_PATH ?? "./lifeops.db";
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
export const db = drizzle(sqlite, { schema });
export { schema };
