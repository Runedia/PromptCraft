import { DBError } from '../../../shared/errors.js';
import type { HistoryRecord, HistorySaveInput } from '../../types.js';
import { getConnection } from '../connection.js';

interface HistoryRow extends Omit<HistoryRecord, 'answers'> {
  answers: string;
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

// db.query()는 SQL 문자열별 prepared statement를 연결 인스턴스에 캐시한다(연결 종료 시 함께 폐기).
// db.prepare()는 호출마다 새로 컴파일하므로, 고정 SQL을 반복 실행하는 리포지토리에서는 query()가 재컴파일을 제거한다.

function save(data: HistorySaveInput): number {
  const db = getConnection();
  const { treeId, situation, prompt, scanPath = null, answers } = data;
  try {
    const stmt = db.query(
      `INSERT INTO history (treeId, situation, prompt, scanPath, answers)
       VALUES (?, ?, ?, ?, ?)`
    );
    const result = stmt.run(treeId, situation, prompt, scanPath, JSON.stringify(answers));
    return Number(result.lastInsertRowid);
  } catch (err: unknown) {
    throw new DBError(`history.save failed: ${toErrorMessage(err)}`);
  }
}

function findAll({ limit = 20, offset = 0 }: { limit?: number; offset?: number } = {}): HistoryRecord[] {
  const db = getConnection();
  const rows = db.query(`SELECT * FROM history ORDER BY id DESC LIMIT ? OFFSET ?`).all(limit, offset) as HistoryRow[];
  return rows.map(_parse);
}

function findById(id: number): HistoryRecord | null {
  const db = getConnection();
  const row = db.query(`SELECT * FROM history WHERE id = ?`).get(id) as HistoryRow | undefined;
  return row ? _parse(row) : null;
}

function findLatestByTree(treeId: string): HistoryRecord | null {
  const db = getConnection();
  const row = db.query(`SELECT * FROM history WHERE treeId = ? ORDER BY id DESC LIMIT 1`).get(treeId) as HistoryRow | undefined;
  return row ? _parse(row) : null;
}

function deleteById(id: number): number {
  const db = getConnection();
  const result = db.query(`DELETE FROM history WHERE id = ?`).run(id);
  return result.changes;
}

function count(): number {
  const db = getConnection();
  const row = db.query(`SELECT COUNT(*) AS cnt FROM history`).get() as { cnt: number };
  return row.cnt;
}

function clearAll(): number {
  const db = getConnection();
  const result = db.query('DELETE FROM history').run();
  return result.changes;
}

function _parse(row: HistoryRow): HistoryRecord {
  return { ...row, answers: JSON.parse(row.answers) };
}

export { clearAll, count, deleteById as delete, findAll, findById, findLatestByTree, save };
