import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as connection from '../../../src/core/db/connection.js';
import * as db from '../../../src/core/db/index.js';
import { exportData, importData } from '../../../src/core/db/transfer.js';
import type { PromptAnswers } from '../../../src/core/types.js';
import { DBError, ValidationError } from '../../../src/shared/errors.js';

const ANSWERS = { q1: 'a1' } as unknown as PromptAnswers;

let tmpDir: string;
let configPath: string;

beforeEach(() => {
  connection.initialize(':memory:');
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-transfer-'));
  configPath = path.join(tmpDir, 'config.json');
});

afterEach(() => {
  connection.closeConnection();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('exportData', () => {
  test('history·dbConfig·globalConfig·버전 메타를 포함한 번들 반환', () => {
    db.history.save({ treeId: 't1', situation: 's1', prompt: 'p1', scanPath: null, answers: ANSWERS });
    db.config.set('ui.language', 'ko');
    fs.writeFileSync(configPath, JSON.stringify({ 'scan.maxDepth': 5 }), 'utf8');

    const bundle = exportData('2026-06-10T00:00:00.000Z', configPath);

    expect(bundle.format).toBe('promptcraft-export');
    expect(bundle.formatVersion).toBe(1);
    expect(bundle.schemaVersion).toBe(db.SCHEMA_VERSION);
    expect(bundle.exportedAt).toBe('2026-06-10T00:00:00.000Z');
    expect(bundle.history.length).toBe(1);
    expect(bundle.history[0].prompt).toBe('p1');
    // answers는 직렬화 문자열이 아니라 파싱된 객체로 export된다
    expect(bundle.history[0].answers).toEqual(ANSWERS);
    expect(bundle.dbConfig.find((c) => c.key === 'ui.language')?.value).toBe('ko');
    expect(bundle.globalConfig).toEqual({ 'scan.maxDepth': 5 });
  });

  test('빈 DB + config.json 부재 → 빈 배열·빈 객체', () => {
    const bundle = exportData('2026-06-10T00:00:00.000Z', configPath);
    expect(bundle.history).toEqual([]);
    expect(bundle.dbConfig).toEqual([]);
    expect(bundle.globalConfig).toEqual({});
  });

  test('유효 JSON이지만 비객체인 answers 행 → {}로 정규화 + import 라운드트립 성공', () => {
    connection
      .getConnection()
      .query(`INSERT INTO history (treeId, situation, prompt, scanPath, answers, createdAt) VALUES (?, ?, ?, ?, ?, ?)`)
      .run('t1', 's', 'p', null, '[1,2]', '2026-06-09 12:00:00');
    const bundle = exportData('2026-06-10T00:00:00.000Z', configPath);
    expect(bundle.history[0].answers).toEqual({} as PromptAnswers);

    // export 산출물은 import 검증을 통과해야 한다 (자기 일관성)
    connection.closeConnection();
    connection.initialize(':memory:');
    const result = importData(bundle, path.join(tmpDir, 'rt-config.json'));
    expect(result.historyAdded).toBe(1);
    expect(db.history.count()).toBe(1);
  });

  test('손상된 answers 행 → DBError에 행 id 포함', () => {
    connection
      .getConnection()
      .query(`INSERT INTO history (treeId, situation, prompt, scanPath, answers, createdAt) VALUES (?, ?, ?, ?, ?, ?)`)
      .run('t1', 's', 'p', null, '{broken', '2026-06-09 12:00:00');
    expect(() => exportData('2026-06-10T00:00:00.000Z', configPath)).toThrow(DBError);
    expect(() => exportData('2026-06-10T00:00:00.000Z', configPath)).toThrow(/history #/);
  });
});

function emptyBundle(overrides: Record<string, unknown> = {}) {
  return {
    format: 'promptcraft-export',
    formatVersion: 1,
    schemaVersion: db.SCHEMA_VERSION,
    exportedAt: '2026-06-10T00:00:00.000Z',
    history: [],
    dbConfig: [],
    globalConfig: {},
    ...overrides,
  };
}

describe('importData — 검증', () => {
  test('format 불일치 → ValidationError', () => {
    expect(() => importData(emptyBundle({ format: 'something-else' }), configPath)).toThrow(ValidationError);
  });

  test('객체가 아닌 입력 → ValidationError', () => {
    expect(() => importData(null, configPath)).toThrow(ValidationError);
    expect(() => importData('text', configPath)).toThrow(ValidationError);
  });

  test('schemaVersion이 앱보다 높음 → ValidationError (업데이트 안내)', () => {
    expect(() => importData(emptyBundle({ schemaVersion: db.SCHEMA_VERSION + 1 }), configPath)).toThrow(ValidationError);
  });

  test('history/dbConfig가 배열이 아님 → ValidationError', () => {
    expect(() => importData(emptyBundle({ history: 'nope' }), configPath)).toThrow(ValidationError);
    expect(() => importData(emptyBundle({ dbConfig: 42 }), configPath)).toThrow(ValidationError);
  });

  test('history 레코드 필수 필드 누락 → ValidationError, DB 무변경', () => {
    expect(() => importData(emptyBundle({ history: [{ prompt: 'p' }] }), configPath)).toThrow(ValidationError);
    expect(db.history.count()).toBe(0);
  });

  test('빈 번들 → 카운트 0 성공', () => {
    const result = importData(emptyBundle(), configPath);
    expect(result).toEqual({ historyAdded: 0, historySkipped: 0, configKeysApplied: 0, warnings: [] });
  });
});

describe('importData — 병합', () => {
  test('export → 빈 DB에 import 라운드트립 → 데이터 동일', () => {
    db.history.save({ treeId: 't1', situation: 's1', prompt: 'p1', scanPath: null, answers: ANSWERS });
    db.config.set('ui.language', 'ko');
    fs.writeFileSync(configPath, JSON.stringify({ 'scan.maxDepth': 5 }), 'utf8');
    const bundle = exportData('2026-06-10T00:00:00.000Z', configPath);

    // 새 DB + 새 config 파일로 복원
    connection.closeConnection();
    connection.initialize(':memory:');
    const configPath2 = path.join(tmpDir, 'config2.json');
    const result = importData(bundle, configPath2);

    expect(result.historyAdded).toBe(1);
    expect(result.historySkipped).toBe(0);
    expect(db.history.count()).toBe(1);
    expect(db.history.findAll()[0].prompt).toBe('p1');
    expect(db.history.findAll()[0].answers).toEqual(ANSWERS);
    expect(db.config.get('ui.language')).toBe('ko');
    expect(JSON.parse(fs.readFileSync(configPath2, 'utf8'))).toEqual({ 'scan.maxDepth': 5 });
  });

  test('(treeId, createdAt, prompt) 동일 레코드는 스킵', () => {
    db.history.save({ treeId: 't1', situation: 's1', prompt: 'p1', scanPath: null, answers: ANSWERS });
    const bundle = exportData('2026-06-10T00:00:00.000Z', configPath);

    const result = importData(bundle, configPath);
    expect(result.historyAdded).toBe(0);
    expect(result.historySkipped).toBe(1);
    expect(db.history.count()).toBe(1);
  });

  test('dbConfig는 키 단위 덮어쓰기', () => {
    db.config.set('ui.language', 'en');
    const bundle = emptyBundle({
      dbConfig: [{ key: 'ui.language', value: 'ko', updatedAt: '2026-06-09 00:00:00' }],
    });
    const result = importData(bundle, configPath);
    expect(db.config.get('ui.language')).toBe('ko');
    expect(result.configKeysApplied).toBe(1);
  });

  test('globalConfig는 기존 파일과 키 단위 병합', () => {
    fs.writeFileSync(configPath, JSON.stringify({ keep: 1, overwrite: 'old' }), 'utf8');
    const bundle = emptyBundle({ globalConfig: { overwrite: 'new', added: true } });
    const result = importData(bundle, configPath);
    expect(JSON.parse(fs.readFileSync(configPath, 'utf8'))).toEqual({ keep: 1, overwrite: 'new', added: true });
    expect(result.configKeysApplied).toBe(2);
    expect(result.warnings).toEqual([]);
  });

  test('globalConfig 기록 실패 → DB는 반영, warnings로 보고 (부분 성공)', () => {
    const badPath = path.join(tmpDir, 'no-such-dir-file', 'config.json');
    fs.writeFileSync(path.join(tmpDir, 'no-such-dir-file'), '', 'utf8'); // 같은 이름의 "파일"을 만들어 mkdir 실패 유도
    const bundle = emptyBundle({
      dbConfig: [{ key: 'k', value: 'v', updatedAt: '2026-06-09 00:00:00' }],
      globalConfig: { a: 1 },
    });
    const result = importData(bundle, badPath);
    expect(db.config.get('k')).toBe('v');
    expect(result.warnings.length).toBe(1);
  });

  test('구분자 결합 시 충돌하는 서로 다른 튜플 2개 → 둘 다 추가 (경계 모호성 회귀 가드)', () => {
    // ('t1', '2026-06-09 12:00:00', 'x')와 ('t1', '2026-06-09', '12:00:00 x')는
    // 스페이스 결합 키가 동일("t1 2026-06-09 12:00:00 x")하지만 다른 레코드다.
    const base = { id: 1, situation: 's', scanPath: null, answers: {} };
    const result = importData(
      emptyBundle({
        history: [
          { ...base, treeId: 't1', createdAt: '2026-06-09 12:00:00', prompt: 'x' },
          { ...base, treeId: 't1', createdAt: '2026-06-09', prompt: '12:00:00 x' },
        ],
      }),
      configPath
    );
    expect(result.historyAdded).toBe(2);
    expect(result.historySkipped).toBe(0);
    expect(db.history.count()).toBe(2);
  });

  test('번들 내 동일 레코드 2개 → 1 추가, 1 스킵', () => {
    const rec = { id: 1, treeId: 't1', situation: 's', prompt: 'p', scanPath: null, answers: { q: 'a' }, createdAt: '2026-06-09 12:00:00' };
    const result = importData(emptyBundle({ history: [rec, { ...rec }] }), configPath);
    expect(result.historyAdded).toBe(1);
    expect(result.historySkipped).toBe(1);
    expect(db.history.count()).toBe(1);
  });

  test('트랜잭션 중간 실패 → DBError + DB 무변경 (history insert 롤백)', () => {
    // dbConfig upsert가 트랜잭션 중간에 실패하도록 config 테이블을 미리 제거한다.
    connection.getConnection().exec('DROP TABLE config');
    const bundle = emptyBundle({
      history: [{ id: 1, treeId: 't1', situation: 's', prompt: 'p', scanPath: null, answers: {}, createdAt: '2026-06-09 12:00:00' }],
      dbConfig: [{ key: 'k', value: 'v', updatedAt: '2026-06-09 00:00:00' }],
    });
    expect(() => importData(bundle, configPath)).toThrow(DBError);
    // history insert가 먼저 성공했더라도 트랜잭션 전체가 롤백되어야 한다.
    expect(db.history.count()).toBe(0);
  });
});
