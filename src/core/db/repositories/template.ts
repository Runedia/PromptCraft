import { DBError } from '../../../shared/errors.js';
import type { TemplateRecord, TemplateSaveInput, TemplateUpdateInput } from '../../types.js';
import { getConnection } from '../connection.js';

interface TemplateRow extends Omit<TemplateRecord, 'answers'> {
  answers: string;
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function save(data: TemplateSaveInput): number | bigint {
  const db = getConnection();
  const { name, treeId, answers } = data;
  try {
    const stmt = db.prepare(`INSERT INTO template (name, treeId, answers) VALUES (?, ?, ?)`);
    const result = stmt.run(name, treeId, JSON.stringify(answers));
    return result.lastInsertRowid;
  } catch (err: unknown) {
    throw new DBError(`template.save failed: ${toErrorMessage(err)}`);
  }
}

function findAll(): TemplateRecord[] {
  const db = getConnection();
  const rows = db.prepare(`SELECT * FROM template ORDER BY id ASC`).all() as TemplateRow[];
  return rows.map(_parse);
}

function findById(id: number): TemplateRecord | null {
  const db = getConnection();
  const row = db.prepare(`SELECT * FROM template WHERE id = ?`).get(id) as TemplateRow | undefined;
  return row ? _parse(row) : null;
}

function findByName(name: string): TemplateRecord | null {
  const db = getConnection();
  const row = db.prepare(`SELECT * FROM template WHERE name = ?`).get(name) as
    | TemplateRow
    | undefined;
  return row ? _parse(row) : null;
}

function update(id: number, data: TemplateUpdateInput): number {
  const db = getConnection();
  const fields: string[] = [];
  const values: Array<string | number> = [];

  if (data.name !== undefined) {
    fields.push('name = ?');
    values.push(data.name);
  }
  if (data.treeId !== undefined) {
    fields.push('treeId = ?');
    values.push(data.treeId);
  }
  if (data.answers !== undefined) {
    fields.push('answers = ?');
    values.push(JSON.stringify(data.answers));
  }

  fields.push("updatedAt = datetime('now')");
  values.push(id);

  try {
    const result = db
      .prepare(`UPDATE template SET ${fields.join(', ')} WHERE id = ?`)
      .run(...values);
    return result.changes;
  } catch (err: unknown) {
    throw new DBError(`template.update failed: ${toErrorMessage(err)}`);
  }
}

function deleteById(id: number): number {
  const db = getConnection();
  const result = db.prepare(`DELETE FROM template WHERE id = ?`).run(id);
  return result.changes;
}

function _parse(row: TemplateRow): TemplateRecord {
  return { ...row, answers: JSON.parse(row.answers) };
}

export { deleteById as delete, findAll, findById, findByName, save, update };
