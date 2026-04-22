import { Database } from 'bun:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { DB_PATH } from '../../shared/constants.js';
import { DBError } from '../../shared/errors.js';

let _db: Database | null = null;

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function getConnection(): Database {
  if (!_db) {
    throw new DBError('DB not initialized. Call initialize() first.');
  }
  return _db;
}

function initialize(dbPath?: string): Database {
  if (_db) return _db;

  const resolvedPath = dbPath || DB_PATH;

  if (resolvedPath !== ':memory:') {
    const dir = path.dirname(resolvedPath);
    fs.mkdirSync(dir, { recursive: true });
  }

  try {
    _db = new Database(resolvedPath);
  } catch (err: unknown) {
    throw new DBError(`Failed to open database: ${toErrorMessage(err)}`);
  }

  _db.exec('PRAGMA journal_mode = WAL');

  _db.exec(`
    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      treeId TEXT NOT NULL,
      situation TEXT NOT NULL,
      prompt TEXT NOT NULL,
      scanPath TEXT,
      answers TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS template (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      treeId TEXT NOT NULL,
      answers TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  process.removeAllListeners('exit');
  process.on('exit', closeConnection);

  return _db;
}

function closeConnection(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}

export { closeConnection, getConnection, initialize };
