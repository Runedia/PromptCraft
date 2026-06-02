import { Database } from 'bun:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { DB_PATH } from '../../shared/constants.js';
import { DBError } from '../../shared/errors.js';

let _db: Database | null = null;
let _exitHandlerRegistered = false;

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

  const resolvedPath = dbPath || process.env.PROMPTCRAFT_DB_PATH || DB_PATH;

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
  // 멀티 인스턴스 동시 실행 시 writer 경합으로 즉시 SQLITE_BUSY가 나는 대신 최대 5초 대기 후 재시도.
  // journal_mode는 파일에 영속되지만 busy_timeout은 연결 범위 설정이므로 연결을 열 때마다 설정한다.
  _db.exec('PRAGMA busy_timeout = 5000');

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

    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // exit 핸들러는 프로세스 생애 1회만 등록한다. removeAllListeners('exit')는 다른 모듈의
  // exit 핸들러까지 제거하는 부작용이 있어, 가드 플래그로 중복 등록만 방지한다.
  // closeConnection은 _db가 null이면 무시하므로 init/close 반복(테스트)에도 안전하다.
  if (!_exitHandlerRegistered) {
    process.on('exit', closeConnection);
    _exitHandlerRegistered = true;
  }

  return _db;
}

function closeConnection(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}

export { closeConnection, getConnection, initialize };
