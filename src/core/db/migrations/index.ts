import type { Database } from 'bun:sqlite';
import { DBError } from '../../../shared/errors.js';
import type { Migration } from './types.js';
import { v1 } from './v1.js';

const MIGRATIONS: Migration[] = [v1];
const SCHEMA_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;

interface RunOptions {
  dbPath: string;
  isNewDb: boolean;
  /** 테스트 주입용. 기본값은 MIGRATIONS. */
  migrations?: Migration[];
}

function getUserVersion(db: Database): number {
  return (db.query('PRAGMA user_version').get() as { user_version: number }).user_version;
}

/** Windows 파일명에 콜론 불가 — yyyyMMdd-HHmmss-SSS. 동시 기동 인스턴스 간 충돌 확률을 ms 단위로 낮춘다. */
function backupTimestamp(): string {
  const d = new Date();
  const p = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}-${p(d.getMilliseconds(), 3)}`;
}

/** WAL 모드에서 파일 복사는 -wal/-shm 미반영 위험이 있다 — VACUUM INTO는 체크포인트된 단일 파일을 보장한다. */
function backupDatabase(db: Database, dbPath: string): string {
  const backupPath = `${dbPath}.bak.${backupTimestamp()}`;
  db.exec(`VACUUM INTO '${backupPath.replace(/'/g, "''")}'`);
  return backupPath;
}

function runMigrations(db: Database, options: RunOptions): void {
  const migrations = options.migrations ?? MIGRATIONS;
  const latest = migrations[migrations.length - 1].version;
  const current = getUserVersion(db);
  if (current === latest) return;

  if (current > latest) {
    throw new DBError(`DB 스키마 버전(${current})이 이 앱이 지원하는 버전(${latest})보다 높습니다. 최신 버전의 PromptCraft로 업데이트한 뒤 다시 실행하십시오.`);
  }

  let backupPath: string | null = null;
  if (!options.isNewDb && options.dbPath !== ':memory:') {
    // 동시 기동 경합 시 다른 인스턴스가 먼저 마이그레이션을 끝내면 이 백업은 적용 없이 남는 고아 .bak이 된다 — 무해하며 안전 우선.
    backupPath = backupDatabase(db, options.dbPath);
  }

  for (const m of migrations) {
    if (m.version <= current) continue;
    try {
      // BEGIN IMMEDIATE도 try 안에서 — 다른 인스턴스의 write 락 경합(database is locked)도 DBError로 변환한다.
      db.exec('BEGIN IMMEDIATE');
      // 동시 기동한 다른 인스턴스가 락 대기 중 먼저 적용했을 수 있다 — 락 획득 후 재확인.
      if (getUserVersion(db) >= m.version) {
        db.exec('ROLLBACK');
        continue;
      }
      m.up(db);
      db.exec(`PRAGMA user_version = ${m.version}`);
      db.exec('COMMIT');
    } catch (err) {
      try {
        db.exec('ROLLBACK');
      } catch {
        // SQLite가 이미 자동 롤백한 경우(SQLITE_FULL 등) — 원래 에러 보존이 우선
      }
      const hint = backupPath ? ` 백업: ${backupPath} — 이 파일을 원래 DB 파일명으로 복사하면 복원됩니다.` : '';
      throw new DBError(`마이그레이션 v${m.version} 실패: ${err instanceof Error ? err.message : String(err)}.${hint}`);
    }
  }
}

export type { RunOptions };
export { getUserVersion, MIGRATIONS, runMigrations, SCHEMA_VERSION };
