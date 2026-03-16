'use strict';

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { DB_PATH, DATA_DIR } = require('../../shared/constants');
const { DBError } = require('../../shared/errors');

let _db = null;

function getConnection(dbPath) {
  if (!_db) {
    throw new DBError('DB not initialized. Call initialize() first.');
  }
  return _db;
}

function initialize(dbPath) {
  const resolvedPath = dbPath || DB_PATH;

  if (resolvedPath !== ':memory:') {
    const dir = path.dirname(resolvedPath);
    fs.mkdirSync(dir, { recursive: true });
  }

  try {
    _db = new Database(resolvedPath);
  } catch (err) {
    throw new DBError(`Failed to open database: ${err.message}`);
  }

  _db.pragma('journal_mode = WAL');

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

function closeConnection() {
  if (_db) {
    _db.close();
    _db = null;
  }
}

module.exports = { getConnection, initialize, closeConnection };
