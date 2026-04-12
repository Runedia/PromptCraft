import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

// jest.mock 팩토리 내부에서 require 가능 — DATA_DIR을 temp dir로 대체
jest.mock('../../../src/shared/constants', () => {
  const path = require('node:path');
  const os = require('node:os');
  return { DATA_DIR: path.join(os.tmpdir(), `promptcraft-config-test-${process.pid}`) };
});

const { ConfigManager, DEFAULTS } = require('../../../src/core/config/config-manager');

// mock된 DATA_DIR 경로 (config-manager 모듈과 동일한 값)
const MOCK_DATA_DIR = path.join(os.tmpdir(), `promptcraft-config-test-${process.pid}`);
const MOCK_GLOBAL_CONFIG = path.join(MOCK_DATA_DIR, 'config.json');

let projectDir: string;

beforeEach(() => {
  // 테스트별 독립된 프로젝트 디렉토리
  projectDir = path.join(os.tmpdir(), `promptcraft-project-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  // 글로벌 설정 파일 초기화
  if (fs.existsSync(MOCK_GLOBAL_CONFIG)) fs.unlinkSync(MOCK_GLOBAL_CONFIG);
});

afterAll(() => {
  // 임시 디렉토리 정리
  if (fs.existsSync(MOCK_DATA_DIR)) fs.rmSync(MOCK_DATA_DIR, { recursive: true, force: true });
  if (fs.existsSync(projectDir)) fs.rmSync(projectDir, { recursive: true, force: true });
});

// ─── DEFAULTS ────────────────────────────────────────────────────────

describe('DEFAULTS', () => {
  test('기본 키 목록이 존재한다', () => {
    const keys = Object.keys(DEFAULTS);
    expect(keys).toContain('scan.maxDepth');
    expect(keys).toContain('scan.extraIgnore');
    expect(keys).toContain('context.defaultFormats');
  });
});

// ─── get() — 기본값 fallback ──────────────────────────────────────────

describe('ConfigManager.get() — 기본값', () => {
  test('파일 없을 때 기본값을 반환한다', () => {
    const cm = new ConfigManager();
    expect(cm.get('scan.maxDepth')).toBeNull();
    expect(cm.get('scan.extraIgnore')).toEqual([]);
    expect(cm.get('context.defaultFormats')).toBe('claude,gemini,cursorrules');
  });

  test('존재하지 않는 키는 null을 반환한다', () => {
    const cm = new ConfigManager();
    expect(cm.get('nonexistent.key')).toBeNull();
  });
});

// ─── set() / get() — 글로벌 스코프 ───────────────────────────────────

describe('ConfigManager.set() / get() — global scope', () => {
  test('글로벌 설정을 저장하고 조회한다', () => {
    const cm = new ConfigManager();
    cm.set('scan.maxDepth', 5);
    expect(cm.get('scan.maxDepth')).toBe(5);
  });

  test('여러 키를 독립적으로 저장한다', () => {
    const cm = new ConfigManager();
    cm.set('scan.maxDepth', 3);
    cm.set('context.defaultFormats', 'claude');
    expect(cm.get('scan.maxDepth')).toBe(3);
    expect(cm.get('context.defaultFormats')).toBe('claude');
  });

  test('프로젝트 경로 없이 project 스코프 set 시 에러', () => {
    const cm = new ConfigManager();
    expect(() => cm.set('scan.maxDepth', 5, 'project')).toThrow('프로젝트 경로가 설정되지 않았습니다');
  });
});

// ─── set() / get() — 프로젝트 스코프 ────────────────────────────────

describe('ConfigManager.set() / get() — project scope', () => {
  test('프로젝트 설정을 저장하고 조회한다', () => {
    const cm = new ConfigManager(projectDir);
    cm.set('scan.maxDepth', 10, 'project');
    expect(cm.get('scan.maxDepth')).toBe(10);
  });

  test('프로젝트 설정이 글로벌 설정보다 우선순위가 높다', () => {
    const cm = new ConfigManager(projectDir);
    cm.set('scan.maxDepth', 3, 'global');
    cm.set('scan.maxDepth', 7, 'project');
    expect(cm.get('scan.maxDepth')).toBe(7);
  });

  test('.promptcraft 디렉토리를 자동으로 생성한다', () => {
    const cm = new ConfigManager(projectDir);
    cm.set('scan.maxDepth', 2, 'project');
    const configPath = path.join(projectDir, '.promptcraft', 'config.json');
    expect(fs.existsSync(configPath)).toBe(true);
  });
});

// ─── delete() ────────────────────────────────────────────────────────

describe('ConfigManager.delete()', () => {
  test('글로벌 설정 키를 삭제하면 기본값으로 fallback된다', () => {
    const cm = new ConfigManager();
    cm.set('scan.maxDepth', 5);
    cm.delete('scan.maxDepth');
    expect(cm.get('scan.maxDepth')).toBeNull(); // DEFAULTS의 null
  });

  test('프로젝트 경로 없이 project 스코프 delete는 무시된다', () => {
    const cm = new ConfigManager();
    // 에러 없이 통과해야 한다
    expect(() => cm.delete('scan.maxDepth', 'project')).not.toThrow();
  });

  test('저장된 적 없는 키 delete()는 에러 없이 통과한다 (no-op)', () => {
    const cm = new ConfigManager();
    expect(() => cm.delete('scan.maxDepth')).not.toThrow();
    expect(cm.get('scan.maxDepth')).toBeNull();
  });

  test('프로젝트 설정 삭제 후 글로벌 설정으로 fallback된다', () => {
    const cm = new ConfigManager(projectDir);
    cm.set('scan.maxDepth', 3, 'global');
    cm.set('scan.maxDepth', 7, 'project');
    expect(cm.get('scan.maxDepth')).toBe(7);
    cm.delete('scan.maxDepth', 'project');
    expect(cm.get('scan.maxDepth')).toBe(3);
  });
});

// ─── 손상된 JSON 복구 ────────────────────────────────────────────────

describe('ConfigManager — 손상된 설정 파일 복구', () => {
  test('글로벌 설정 파일이 유효하지 않은 JSON이면 기본값으로 fallback된다', () => {
    fs.mkdirSync(MOCK_DATA_DIR, { recursive: true });
    fs.writeFileSync(MOCK_GLOBAL_CONFIG, '{ invalid json :::');
    const cm = new ConfigManager();
    expect(cm.get('context.defaultFormats')).toBe('claude,gemini,cursorrules');
    expect(cm.get('scan.extraIgnore')).toEqual([]);
  });
});

// ─── list() ──────────────────────────────────────────────────────────

describe('ConfigManager.list()', () => {
  test('모든 기본 키를 포함한 목록을 반환한다', () => {
    const cm = new ConfigManager();
    const result = cm.list();
    for (const key of Object.keys(DEFAULTS)) {
      expect(result[key]).toBeDefined();
      expect(result[key]).toHaveProperty('value');
      expect(result[key]).toHaveProperty('source');
    }
  });

  test('기본값 항목의 source는 "default"이다', () => {
    const cm = new ConfigManager();
    const result = cm.list();
    expect(result['scan.maxDepth'].source).toBe('default');
  });

  test('글로벌 설정 항목의 source는 "global"이다', () => {
    const cm = new ConfigManager();
    cm.set('scan.maxDepth', 5);
    const result = cm.list();
    expect(result['scan.maxDepth'].source).toBe('global');
  });

  test('프로젝트 설정 항목의 source는 "project"이다', () => {
    const cm = new ConfigManager(projectDir);
    cm.set('scan.maxDepth', 5, 'project');
    const result = cm.list();
    expect(result['scan.maxDepth'].source).toBe('project');
  });
});
