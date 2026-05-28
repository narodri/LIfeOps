import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const cards = sqliteTable("cards", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  theme: text("theme").notNull(),
  status: text("status").notNull(),
  period: text("period").notNull(),
  deadline: text("deadline"),
  detailMemo: text("detail_memo"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
  lastProgressMemoAt: integer("last_progress_memo_at")
});

export const progressMemos = sqliteTable("progress_memos", {
  id:text("id").primaryKey(),
  cardId:text("card_id").notNull().references(() => cards.id, { onDelete: "cascade" }),
  body:text("body").notNull(),
  createdAt:integer("created_at").notNull()
});

export const longTermGoals = sqliteTable("long_term_goals", {id:text("id").primaryKey(), title:text("title").notNull(), order:integer("order").notNull(), createdAt:integer("created_at").notNull(), updatedAt:integer("updated_at").notNull()});
export const compass = sqliteTable("compass", {id:text("id").primaryKey(), threeMonthDirection:text("three_month_direction").notNull().default(""), updatedAt:integer("updated_at").notNull()});
export const compassNotes = sqliteTable("compass_notes", {id:text("id").primaryKey(), type:text("type").notNull(), body:text("body").notNull(), enabled:integer("enabled",{mode:"boolean"}).notNull().default(true), createdAt:integer("created_at").notNull(), updatedAt:integer("updated_at").notNull()});
export const userSettings = sqliteTable("user_settings", {id:text("id").primaryKey(), backgroundImagePath:text("background_image_path"), primaryColor:text("primary_color").notNull().default("#2563eb"), accentColor:text("accent_color").notNull().default("#10b981"), createdAt:integer("created_at").notNull(), updatedAt:integer("updated_at").notNull()});
export const sessions = sqliteTable("sessions", {id:text("id").primaryKey(), tokenHash:text("token_hash").notNull().unique(), expiresAt:integer("expires_at").notNull(), createdAt:integer("created_at").notNull()});
