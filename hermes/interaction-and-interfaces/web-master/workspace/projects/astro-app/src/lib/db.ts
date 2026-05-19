import Database from 'better-sqlite3';
import { join } from 'path';
import { mkdirSync } from 'fs';

const dataDir = join(process.cwd(), 'data');
mkdirSync(dataDir, { recursive: true });
const dbPath = join(dataDir, 'database.db');

let db: InstanceType<typeof Database>;

export function getDb() {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.exec(`
      CREATE TABLE IF NOT EXISTS waitlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        timestamp TEXT DEFAULT (datetime('now'))
      )
    `);
  }
  return db;
}
