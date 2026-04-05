import { DBError } from '../../../shared/errors.js';
import { getConnection } from '../connection.js';

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function get(key: string): string | null {
  const db = getConnection();
  const row = db.prepare(`SELECT value FROM config WHERE key = ?`).get(key) as
    | { value: string }
    | undefined;
  return row ? row.value : null;
}

function set(key: string, value: string): void {
  const db = getConnection();
  try {
    db.prepare(
      `INSERT OR REPLACE INTO config (key, value, updatedAt) VALUES (?, ?, datetime('now'))`
    ).run(key, value);
  } catch (err: unknown) {
    throw new DBError(`config.set failed: ${toErrorMessage(err)}`);
  }
}

function deleteByKey(key: string): number {
  const db = getConnection();
  const result = db.prepare(`DELETE FROM config WHERE key = ?`).run(key);
  return result.changes;
}

export { deleteByKey as delete, get, set };
