'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { generate, preview, write, generateAll } = require('../src/core/context/generator');

const scanResult = {
  path: '/projects/myapp',
  languages: [
    { name: 'JavaScript', count: 40, percentage: 62.5 },
    { name: 'TypeScript', count: 24, percentage: 37.5 },
  ],
  frameworks: [{ name: 'Express', version: '4.18.2' }],
  packageManager: 'npm',
  structure: {
    name: 'root',
    children: [
      { name: 'src', children: [] },
      { name: 'tests', children: [] },
    ],
  },
  hasEnv: true,
  configFiles: ['package.json', '.env'],
  scannedAt: '2026-03-12T00:00:00.000Z',
};

const userConfig = {
  projectName: 'MyApp',
  codingConventions: 'camelCase functions',
  constraints: 'No external API calls in core',
};

describe('generate()', () => {
  test('claude 포맷 생성 — 핵심 내용 포함', () => {
    const result = generate('claude', scanResult, userConfig);
    expect(result).toContain('MyApp');
    expect(result).toContain('JavaScript');
    expect(result).toContain('Express 4.x');
    expect(result).toContain('Directory Structure');
    expect(result).toContain('Coding Conventions');
    expect(result).toContain('camelCase functions');
    expect(result).toContain('Constraints');
    expect(result).toContain('No external API calls in core');
  });

  test('gemini 포맷 생성 — 핵심 내용 포함', () => {
    const result = generate('gemini', scanResult, userConfig);
    expect(result).toContain('MyApp');
    expect(result).toContain('JavaScript');
    expect(result).toContain('Express 4.x');
    expect(result).toContain('Directory Structure');
    expect(result).toContain('Additional Context');
  });

  test('날짜 주석이 포함된다', () => {
    const result = generate('claude', scanResult, userConfig);
    expect(result).toMatch(/<!-- Generated: \d{4}-\d{2}-\d{2} -->/);
  });

  test('지원하지 않는 포맷은 ContextError를 던진다', () => {
    expect(() => generate('notion', scanResult, userConfig)).toThrow('지원하지 않는 포맷입니다');
  });

  test('projectName 미설정 시 path.basename을 사용한다', () => {
    const result = generate('claude', scanResult, {});
    expect(result).toContain('myapp');
  });
});

describe('preview()', () => {
  test('파일을 생성하지 않고 내용을 반환한다', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-preview-'));
    const result = preview('claude', scanResult, userConfig);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(fs.readdirSync(tmpDir)).toHaveLength(0);
    fs.rmdirSync(tmpDir);
  });
});

describe('write()', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-write-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('claude 포맷 — CLAUDE.md 파일 생성', () => {
    const result = write(tmpDir, 'claude', scanResult, userConfig);
    expect(result.changed).toBe(true);
    expect(result.fileName).toBe('CLAUDE.md');
    expect(fs.existsSync(path.join(tmpDir, 'CLAUDE.md'))).toBe(true);
  });

  test('gemini 포맷 — GEMINI.md 파일 생성', () => {
    const result = write(tmpDir, 'gemini', scanResult, userConfig);
    expect(result.changed).toBe(true);
    expect(result.fileName).toBe('GEMINI.md');
    expect(fs.existsSync(path.join(tmpDir, 'GEMINI.md'))).toBe(true);
  });

  test('동일 내용으로 재실행 시 changed: false 반환 및 파일 미수정', () => {
    write(tmpDir, 'claude', scanResult, userConfig);
    const filePath = path.join(tmpDir, 'CLAUDE.md');
    const mtimeBefore = fs.statSync(filePath).mtimeMs;

    // 동일 내용으로 재실행
    const result = write(tmpDir, 'claude', scanResult, userConfig);
    expect(result.changed).toBe(false);
    expect(result.addedLines).toBe(0);
    expect(result.removedLines).toBe(0);

    const mtimeAfter = fs.statSync(filePath).mtimeMs;
    expect(mtimeAfter).toBe(mtimeBefore);
  });

  test('내용이 다르면 파일을 덮어쓰고 changed: true 반환', () => {
    write(tmpDir, 'claude', scanResult, userConfig);
    const updatedConfig = { ...userConfig, projectName: 'UpdatedApp' };
    const result = write(tmpDir, 'claude', scanResult, updatedConfig);
    expect(result.changed).toBe(true);
    const content = fs.readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf8');
    expect(content).toContain('UpdatedApp');
  });

  test('diff 통계 — 추가/삭제 줄 수 반환', () => {
    write(tmpDir, 'claude', scanResult, userConfig);
    const updatedConfig = { ...userConfig, constraints: 'New constraint added here' };
    const result = write(tmpDir, 'claude', scanResult, updatedConfig);
    expect(result.changed).toBe(true);
    expect(typeof result.addedLines).toBe('number');
    expect(typeof result.removedLines).toBe('number');
  });
});

describe('generateAll()', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-all-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('모든 포맷의 파일이 생성된다', () => {
    const results = generateAll(tmpDir, scanResult, userConfig);
    expect(fs.existsSync(path.join(tmpDir, 'CLAUDE.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'GEMINI.md'))).toBe(true);
    expect(Object.keys(results)).toContain('claude');
    expect(Object.keys(results)).toContain('gemini');
  });
});

describe('.env 내용 노출 방지', () => {
  test('scanResult에 env 값이 있어도 출력에 포함되지 않는다', () => {
    const scanWithEnvHint = {
      ...scanResult,
      envContent: 'SECRET_KEY=abc123\nDB_PASSWORD=hunter2',
    };
    const result = generate('claude', scanWithEnvHint, userConfig);
    expect(result).not.toContain('SECRET_KEY');
    expect(result).not.toContain('DB_PASSWORD');
    expect(result).not.toContain('hunter2');
  });

  test('configFiles 목록에 .env가 있어도 파일 내용은 포함되지 않는다', () => {
    const result = generate('claude', scanResult, userConfig);
    expect(result).not.toContain('.env');
  });
});
