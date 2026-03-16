'use strict';

const { getConnection } = require('../connection');
const { DBError } = require('../../../shared/errors');

function save(data) {
  const db = getConnection();
  const { name, treeId, answers } = data;
  try {
    const stmt = db.prepare(
      `INSERT INTO template (name, treeId, answers) VALUES (?, ?, ?)`
    );
    const result = stmt.run(name, treeId, JSON.stringify(answers));
    return result.lastInsertRowid;
  } catch (err) {
    throw new DBError(`template.save failed: ${err.message}`);
  }
}

function findAll() {
  const db = getConnection();
  const rows = db.prepare(`SELECT * FROM template ORDER BY id ASC`).all();
  return rows.map(_parse);
}

function findById(id) {
  const db = getConnection();
  const row = db.prepare(`SELECT * FROM template WHERE id = ?`).get(id);
  return row ? _parse(row) : null;
}

function findByName(name) {
  const db = getConnection();
  const row = db.prepare(`SELECT * FROM template WHERE name = ?`).get(name);
  return row ? _parse(row) : null;
}

function update(id, data) {
  const db = getConnection();
  const fields = [];
  const values = [];

  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
  if (data.treeId !== undefined) { fields.push('treeId = ?'); values.push(data.treeId); }
  if (data.answers !== undefined) { fields.push('answers = ?'); values.push(JSON.stringify(data.answers)); }

  fields.push("updatedAt = datetime('now')");
  values.push(id);

  try {
    const result = db.prepare(
      `UPDATE template SET ${fields.join(', ')} WHERE id = ?`
    ).run(...values);
    return result.changes;
  } catch (err) {
    throw new DBError(`template.update failed: ${err.message}`);
  }
}

function deleteById(id) {
  const db = getConnection();
  const result = db.prepare(`DELETE FROM template WHERE id = ?`).run(id);
  return result.changes;
}

function _parse(row) {
  return { ...row, answers: JSON.parse(row.answers) };
}

module.exports = { save, findAll, findById, findByName, update, delete: deleteById };
