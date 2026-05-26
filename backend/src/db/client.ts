import sqlite3 from 'sqlite3';
import { drizzle } from 'drizzle-orm/sqlite3';

const sqlite = new sqlite3.Database('./dev.db');

export const db = drizzle(sqlite);
