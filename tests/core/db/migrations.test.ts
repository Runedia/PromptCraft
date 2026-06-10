import { Database } from 'bun:sqlite';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as connection from '../../../src/core/db/connection.js';
import { runMigrations, SCHEMA_VERSION } from '../../../src/core/db/migrations/index.js';
import { DBError } from '../../../src/shared/errors.js';

function userVersion(db: Database): number {
  return (db.query('PRAGMA user_version').get() as { user_version: number }).user_version;
}

function tableNames(db: Database): string[] {
  return (db.query(`SELECT name FROM sqlite_master WHERE type = 'table'`).all() as { name: string }[]).map((r) => r.name);
}

describe('runMigrations — 신규 DB', () => {
  test('빈 DB에 전체 적용 → 테이블 생성 + user_version = SCHEMA_VERSION', () => {
    const db = new Database(':memory:');
    runMigrations(db, { dbPath: ':memory:', isNewDb: true });
    expect(userVersion(db)).toBe(SCHEMA_VERSION);
    const names = tableNames(db);
    expect(names).toContain('history');
    expect(names).toContain('config');
    db.close();
  });

  test('재실행은 no-op (멱등)', () => {
    const db = new Database(':memory:');
    runMigrations(db, { dbPath: ':memory:', isNewDb: true });
    runMigrations(db, { dbPath: ':memory:', isNewDb: true });
    expect(userVersion(db)).toBe(SCHEMA_VERSION);
    db.close();
  });
});

describe('runMigrations — 버전 검사', () => {
  test('user_version > SCHEMA_VERSION → DBError (구버전 앱이 신버전 DB를 여는 경우)', () => {
    const db = new Database(':memory:');
    db.exec(`PRAGMA user_version = ${SCHEMA_VERSION + 1}`);
    expect(() => runMigrations(db, { dbPath: ':memory:', isNewDb: true })).toThrow(DBError);
    db.close();
  });

  test('레거시 DB(user_version=0, 테이블 존재) → 데이터 보존 + v1 스탬프', () => {
    const db = new Database(':memory:');
    // 마이그레이션 도입 이전 connection.ts가 만들던 상태 재현
    db.exec(`
      CREATE TABLE history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        treeId TEXT NOT NULL, situation TEXT NOT NULL, prompt TEXT NOT NULL,
        scanPath TEXT, answers TEXT NOT NULL,
        createdAt TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE config (key TEXT PRIMARY KEY, value TEXT NOT NULL, updatedAt TEXT NOT NULL DEFAULT (datetime('now')));
      INSERT INTO history (treeId, situation, prompt, answers) VALUES ('t1', 's', 'p', '{}');
    `);
    runMigrations(db, { dbPath: ':memory:', isNewDb: false });
    expect(userVersion(db)).toBe(SCHEMA_VERSION);
    const cnt = (db.query('SELECT COUNT(*) AS c FROM history').get() as { c: number }).c;
    expect(cnt).toBe(1);
    db.close();
  });

  test('다른 인스턴스가 이미 최신 적용(별도 연결로 user_version 선반영) → no-op', () => {
    const db = new Database(':memory:');
    db.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`);
    const boom: import('../../../src/core/db/migrations/types.js').Migration = {
      version: SCHEMA_VERSION,
      up() {
        throw new Error('실행되면 안 됨');
      },
    };
    expect(() => runMigrations(db, { dbPath: ':memory:', isNewDb: false, migrations: [boom] })).not.toThrow();
    db.close();
  });

  test('트랜잭션 내 재확인 — 루프 진입 후 user_version이 선반영되면 후속은 skip', () => {
    const db = new Database(':memory:');
    // up() 내부에서 PRAGMA user_version = 2를 설정하는 방식은 불가 — 프레임워크가 up() 직후
    // PRAGMA user_version = ${m.version}으로 덮어쓴다(실측). 대신 동일 version 2개로 경합을 재현한다:
    // m1이 v2를 정상 커밋(프레임워크 스탬프) → m2(같은 v2)는 루프 진입(루프는 시작 시점 current=0과 비교)하지만
    // 트랜잭션 내 재확인(getUserVersion >= m.version)이 2 >= 2로 skip — "다른 인스턴스가 먼저 스탬프" 상황과 동형.
    const m1: import('../../../src/core/db/migrations/types.js').Migration = {
      version: 2,
      up() {
        // no-op — 다른 인스턴스가 v2 적용을 끝낸 역할
      },
    };
    const m2: import('../../../src/core/db/migrations/types.js').Migration = {
      version: 2,
      up() {
        throw new Error('재확인 분기가 작동하면 실행되지 않아야 함');
      },
    };
    expect(() => runMigrations(db, { dbPath: ':memory:', isNewDb: true, migrations: [m1, m2] })).not.toThrow();
    expect(userVersion(db)).toBe(2);
    db.close();
  });
});

function makeTmpDb(): { dir: string; dbPath: string } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-mig-'));
  return { dir, dbPath: path.join(dir, 'promptcraft.db') };
}

function backupFiles(dir: string): string[] {
  return fs.readdirSync(dir).filter((f) => f.includes('.bak.'));
}

describe('runMigrations — 백업', () => {
  test('기존 DB 업그레이드 시 <db>.bak.<ts> 생성', () => {
    const { dir, dbPath } = makeTmpDb();
    const db = new Database(dbPath);
    runMigrations(db, { dbPath, isNewDb: false });
    expect(backupFiles(dir).length).toBe(1);
    db.close();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  test('신규 DB(isNewDb=true)는 백업 생략', () => {
    const { dir, dbPath } = makeTmpDb();
    const db = new Database(dbPath);
    runMigrations(db, { dbPath, isNewDb: true });
    expect(backupFiles(dir).length).toBe(0);
    db.close();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  test('마이그레이션 실패 → ROLLBACK + 백업 보존 + user_version 미변경 + 에러에 백업 경로 포함', () => {
    const { dir, dbPath } = makeTmpDb();
    const db = new Database(dbPath);
    const boom: import('../../../src/core/db/migrations/types.js').Migration = {
      version: 1,
      up(d) {
        d.exec(`CREATE TABLE partial (id INTEGER)`);
        throw new Error('boom');
      },
    };
    let caught: Error | null = null;
    try {
      runMigrations(db, { dbPath, isNewDb: false, migrations: [boom] });
    } catch (e) {
      caught = e as Error;
    }
    expect(caught).toBeInstanceOf(DBError);
    expect(caught?.message).toContain('.bak.');
    expect(userVersion(db)).toBe(0);
    // 트랜잭션 롤백 → partial 테이블 미존재
    expect(tableNames(db)).not.toContain('partial');
    expect(backupFiles(dir).length).toBe(1);
    db.close();
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

describe('initialize — 기동 실패 경로', () => {
  test('마이그레이션 실패 시 연결 미메모이즈 + 원인 해소 후 재시도 성공', () => {
    const { dir, dbPath } = makeTmpDb();
    try {
      // 지원 범위(SCHEMA_VERSION)보다 높은 버전을 선반영해 기동 실패를 유도한다.
      const raw = new Database(dbPath);
      raw.exec('PRAGMA user_version = 99');
      raw.close();

      expect(() => connection.initialize(dbPath)).toThrow(DBError);
      // 실패한 연결이 메모이즈되면 안 된다 — getConnection은 미초기화 에러를 던져야 한다.
      expect(() => connection.getConnection()).toThrow(/not initialized/i);

      // 원인 해소(버전 리셋) 후 재시도는 성공해야 한다.
      const reset = new Database(dbPath);
      reset.exec('PRAGMA user_version = 0');
      reset.close();

      const db = connection.initialize(dbPath);
      expect(userVersion(db)).toBe(SCHEMA_VERSION);
    } finally {
      connection.closeConnection();
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
