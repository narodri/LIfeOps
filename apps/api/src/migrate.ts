import { db } from "./db.js";
const s = db.$client;
s.exec(`
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS cards (id text primary key, title text not null, theme text not null, status text not null, period text not null, deadline text, detail_memo text, created_at integer not null, updated_at integer not null, last_progress_memo_at integer);
CREATE TABLE IF NOT EXISTS progress_memos (id text primary key, card_id text not null REFERENCES cards(id) ON DELETE CASCADE, body text not null, created_at integer not null);
CREATE TABLE IF NOT EXISTS long_term_goals (id text primary key, title text not null, "order" integer not null, created_at integer not null, updated_at integer not null);
CREATE TABLE IF NOT EXISTS compass (id text primary key, three_month_direction text not null default '', updated_at integer not null);
CREATE TABLE IF NOT EXISTS compass_notes (id text primary key, type text not null, body text not null, enabled integer not null default 1, created_at integer not null, updated_at integer not null);
CREATE TABLE IF NOT EXISTS user_settings (id text primary key, background_image_path text, primary_color text not null default '#2563eb', accent_color text not null default '#10b981', created_at integer not null, updated_at integer not null);
CREATE TABLE IF NOT EXISTS sessions (id text primary key, token_hash text not null unique, expires_at integer not null, created_at integer not null);
`);
console.log("migrated");
