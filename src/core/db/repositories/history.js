'use strict';

const { getConnection } = require('../connection');
const { DBError } = require('../../../shared/errors');

function save(data) {
  const db = getConnection();
  const { treeId, situation, prompt, scanPath = null, answers } = data;
  try {
    const stmt = db.prepare(
      `INSERT INTO history (treeId, situation, prompt, scanPath, answers)
       VALUES (?, ?, ?, ?, ?)`
    );
    const result = stmt.run(treeId, situation, prompt, scanPath, JSON.stringify(answers));
    return result.lastInsertRowid;
  } catch (err) {
    throw new DBError(`history.save failed: ${err.message}`);
  }
}

function findAll({ limit = 20, offset = 0 } = {}) {
  const db = getConnection();
  const rows = db.prepare(
    `SELECT * FROM history ORDER BY id DESC LIMIT ? OFFSET ?`
  ).all(limit, offset);
  return rows.map(_parse);
}

function findById(id) {
  const db = getConnection();
  const row = db.prepare(`SELECT * FROM history WHERE id = ?`).get(id);
  return row ? _parse(row) : null;
}

function deleteById(id) {
  const db = getConnection();
  const result = db.prepare(`DELETE FROM history WHERE id = ?`).run(id);
  return result.changes;
}

function count() {
  const db = getConnection();
  const row = db.prepare(`SELECT COUNT(*) AS cnt FROM history`).get();
  return row.cnt;
}

function clearAll() {
  const db = getConnection();
  const result = db.prepare('DELETE FROM history').run();
  return result.changes;
}

function _parse(row) {
  return { ...row, answers: JSON.parse(row.answers) };
}

module.exports = { save, findAll, findById, delete: deleteById, count, clearAll };
