import fs from 'node:fs';
import path from 'node:path';
import { GLOBAL_CONFIG_PATH } from '../../shared/constants.js';
import { DBError, ValidationError } from '../../shared/errors.js';
import type { HistoryRecord, PromptAnswers } from '../types.js';
import { getConnection } from './connection.js';
import { SCHEMA_VERSION } from './migrations/index.js';

// 파일 I/O 주: core의 런타임 I/O 원칙(scanner 예외)과 긴장이 있으나, 글로벌 config.json은
// core/config/config-manager.ts가 이미 같은 방식으로 읽고 쓴다 — 그 선례를 따른다.
// 테스트 격리를 위해 경로는 항상 주입 가능하다.

const EXPORT_FORMAT = 'promptcraft-export';
const FORMAT_VERSION = 1;

interface ExportBundle {
  format: typeof EXPORT_FORMAT;
  formatVersion: number;
  schemaVersion: number;
  exportedAt: string;
  history: HistoryRecord[];
  dbConfig: { key: string; value: string; updatedAt: string }[];
  globalConfig: Record<string, unknown>;
}

interface ImportResult {
  historyAdded: number;
  historySkipped: number;
  configKeysApplied: number;
  warnings: string[];
}

function readJsonFile(filePath: string): Record<string, unknown> {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function exportData(exportedAt: string, globalConfigPath: string = GLOBAL_CONFIG_PATH): ExportBundle {
  const db = getConnection();
  const rows = db.query('SELECT id, treeId, situation, prompt, scanPath, answers, createdAt FROM history ORDER BY id').all() as (Omit<
    HistoryRecord,
    'answers'
  > & { answers: string })[];
  const history = rows.map((r) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(r.answers);
    } catch {
      throw new DBError(`history #${r.id}의 answers가 손상되어 export할 수 없습니다.`);
    }
    // 유효 JSON이지만 객체가 아닌 레거시 값(null·배열·원시값)은 {}로 정규화 —
    // export 산출물이 importData 검증을 항상 통과하도록 자기 일관성을 보장한다.
    const answers = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as PromptAnswers) : ({} as PromptAnswers);
    return { ...r, answers };
  });
  const dbConfig = db.query('SELECT key, value, updatedAt FROM config ORDER BY key').all() as ExportBundle['dbConfig'];
  return {
    format: EXPORT_FORMAT,
    formatVersion: FORMAT_VERSION,
    schemaVersion: SCHEMA_VERSION,
    exportedAt,
    history,
    dbConfig,
    globalConfig: readJsonFile(globalConfigPath),
  };
}

function validateBundle(input: unknown): ExportBundle {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new ValidationError('유효한 export 파일이 아닙니다.');
  }
  const b = input as Record<string, unknown>;
  if (b.format !== EXPORT_FORMAT) {
    throw new ValidationError(`유효한 export 파일이 아닙니다. (format: ${String(b.format)})`);
  }
  if (!Number.isInteger(b.formatVersion) || !Number.isInteger(b.schemaVersion)) {
    throw new ValidationError('formatVersion/schemaVersion이 올바르지 않습니다.');
  }
  if ((b.formatVersion as number) > FORMAT_VERSION) {
    throw new ValidationError(`이 파일은 더 새로운 export 포맷(v${b.formatVersion})으로 만들어졌습니다. PromptCraft를 업데이트한 뒤 다시 시도하십시오.`);
  }
  if (!Array.isArray(b.history) || !Array.isArray(b.dbConfig)) {
    throw new ValidationError('history/dbConfig 배열이 없습니다.');
  }
  if (!b.globalConfig || typeof b.globalConfig !== 'object' || Array.isArray(b.globalConfig)) {
    throw new ValidationError('globalConfig가 객체가 아닙니다.');
  }
  for (const rec of b.history as Record<string, unknown>[]) {
    if (!rec || typeof rec.treeId !== 'string' || typeof rec.prompt !== 'string' || typeof rec.createdAt !== 'string' || typeof rec.situation !== 'string') {
      throw new ValidationError('history 레코드에 필수 필드(treeId·situation·prompt·createdAt)가 없습니다.');
    }
    if (rec.answers !== undefined && (!rec.answers || typeof rec.answers !== 'object' || Array.isArray(rec.answers))) {
      throw new ValidationError('history 레코드의 answers가 객체가 아닙니다.');
    }
    if (rec.scanPath !== undefined && rec.scanPath !== null && typeof rec.scanPath !== 'string') {
      throw new ValidationError('history 레코드의 scanPath가 문자열 또는 null이 아닙니다.');
    }
  }
  for (const c of b.dbConfig as Record<string, unknown>[]) {
    if (!c || typeof c.key !== 'string' || typeof c.value !== 'string') {
      throw new ValidationError('dbConfig 항목에 key/value 문자열이 없습니다.');
    }
  }
  return b as unknown as ExportBundle;
}

function importData(input: unknown, globalConfigPath: string = GLOBAL_CONFIG_PATH): ImportResult {
  const bundle = validateBundle(input);
  if (bundle.schemaVersion > SCHEMA_VERSION) {
    throw new ValidationError(`이 파일은 더 새로운 스키마(v${bundle.schemaVersion})로 만들어졌습니다. PromptCraft를 업데이트한 뒤 다시 시도하십시오.`);
  }
  // 구버전 schemaVersion 레코드 업그레이드 훅 — v1 단일 버전인 현재는 항등 통과.
  // 향후 v2+에서 bundle.schemaVersion < SCHEMA_VERSION 분기로 레코드 변환을 추가한다.

  const db = getConnection();
  let historyAdded = 0;
  let historySkipped = 0;

  // history 병합 + dbConfig upsert를 단일 트랜잭션으로 — 중간 실패 시 DB 무변경.
  // BEGIN IMMEDIATE도 try 안에 — 락 대기 타임아웃(SQLITE_BUSY)을 DBError로 변환한다 (migrations/index.ts 패턴).
  try {
    db.exec('BEGIN IMMEDIATE');
    // (treeId, createdAt, prompt) 복합 키 dedup — 레코드마다 풀스캔하지 않도록 기존 키를 Set으로 선적재.
    // JSON 배열 직렬화는 임의 문자열 내용에 대해 경계 모호성이 없다 — 단순 구분자 결합과 달리 키 충돌 불가.
    const seen = new Set(
      (db.query('SELECT treeId, createdAt, prompt FROM history').all() as { treeId: string; createdAt: string; prompt: string }[]).map((r) =>
        JSON.stringify([r.treeId, r.createdAt, r.prompt])
      )
    );
    const insertStmt = db.query('INSERT INTO history (treeId, situation, prompt, scanPath, answers, createdAt) VALUES (?, ?, ?, ?, ?, ?)');
    for (const rec of bundle.history) {
      const key = JSON.stringify([rec.treeId, rec.createdAt, rec.prompt]);
      if (seen.has(key)) {
        historySkipped++;
        continue;
      }
      // id는 AUTOINCREMENT 재할당 — export 파일의 id는 무시한다.
      insertStmt.run(rec.treeId, rec.situation, rec.prompt, rec.scanPath ?? null, JSON.stringify(rec.answers ?? {}), rec.createdAt);
      seen.add(key); // 번들 내 중복 레코드도 스킵
      historyAdded++;
    }
    const upsertStmt = db.query(`INSERT OR REPLACE INTO config (key, value, updatedAt) VALUES (?, ?, datetime('now'))`);
    for (const c of bundle.dbConfig) {
      upsertStmt.run(c.key, c.value);
    }
    db.exec('COMMIT');
  } catch (err) {
    try {
      db.exec('ROLLBACK');
    } catch {
      // SQLite가 이미 자동 롤백한 경우(SQLITE_FULL 등) — 원래 에러 보존이 우선
    }
    throw new DBError(`import 실패(DB 무변경): ${err instanceof Error ? err.message : String(err)}`);
  }

  // DB 커밋 후 globalConfig 병합 기록 — 파일 실패는 전체 실패가 아니라 경고 (DB는 이미 정합 상태).
  const warnings: string[] = [];
  let configKeysApplied = bundle.dbConfig.length;
  const globalKeys = Object.keys(bundle.globalConfig);
  if (globalKeys.length > 0) {
    try {
      const current = readJsonFile(globalConfigPath);
      fs.mkdirSync(path.dirname(globalConfigPath), { recursive: true });
      fs.writeFileSync(globalConfigPath, JSON.stringify({ ...current, ...bundle.globalConfig }, null, 2), 'utf8');
      configKeysApplied += globalKeys.length;
    } catch (err) {
      warnings.push(`글로벌 config.json 기록 실패: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { historyAdded, historySkipped, configKeysApplied, warnings };
}

export type { ExportBundle, ImportResult };
export { EXPORT_FORMAT, exportData, FORMAT_VERSION, importData };
