'use strict';

const { getConnection } = require('../connection');
const { DBError } = require('../../../shared/errors');

function get(key) {
  const db = getConnection();
  const row = db.prepare(`SELECT value FROM config WHERE key = ?`).get(key);
  return row ? row.value : null;
}

function set(key, value) {
  const db = getConnection();
  try {
    db.prepare(
      `INSERT OR REPLACE INTO config (key, value, updatedAt) VALUES (?, ?, datetime('now'))`
    ).run(key, value);
  } catch (err) {
    throw new DBError(`config.set failed: ${err.message}`);
  }
}

function deleteByKey(key) {
  const db = getConnection();
  const result = db.prepare(`DELETE FROM config WHERE key = ?`).run(key);
  return result.changes;
}

module.exports = { get, set, delete: deleteByKey };
