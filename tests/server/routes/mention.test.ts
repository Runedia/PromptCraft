import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import router from '../../../src/server/routes/mention.js';
import { _resetForTest, registerScanRoot } from '../../../src/server/scanRegistry.js';
import { makeApp } from '../../helpers/make-app.js';

const app = makeApp(router);

// 스캔 루트 레지스트리를 격리된 임시 파일로 고정 (사용자 실제 ~/.promptcraft 비참조).
const ROOTS_FILE = path.join(os.tmpdir(), `pc-scanned-roots-${process.pid}.json`);

let tmpDir: string;

beforeAll(() => {
  process.env.PROMPTCRAFT_SCANNED_ROOTS_PATH = ROOTS_FILE;
  fs.rmSync(ROOTS_FILE, { force: true });
  _resetForTest();
});

afterAll(() => {
  fs.rmSync(ROOTS_FILE, { force: true });
  delete process.env.PROMPTCRAFT_SCANNED_ROOTS_PATH;
});

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mention-test-'));
  fs.mkdirSync(path.join(tmpDir, 'src'));
  fs.writeFileSync(path.join(tmpDir, 'src', 'index.ts'), 'export {}');
  fs.writeFileSync(path.join(tmpDir, 'README.md'), '# Project');
  fs.mkdirSync(path.join(tmpDir, 'node_modules'));
  registerScanRoot(tmpDir); // 스캔된 루트로 등록 → mention 게이트 통과
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ─── GET /suggest ─────────────────────────────────────────────────────

describe('GET /api/mention/suggest', () => {
  test('root 없으면 400', async () => {
    const res = await request(app).get('/suggest');
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('루트 디렉토리 내 항목 제안', async () => {
    const res = await request(app).get(`/suggest?root=${encodeURIComponent(tmpDir)}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.suggestions)).toBe(true);
  });

  test('node_modules 같은 무시 디렉토리는 제외', async () => {
    const res = await request(app).get(`/suggest?root=${encodeURIComponent(tmpDir)}`);
    const paths = res.body.suggestions.map((s: { path: string; display: string; isDir: boolean }) => s.path);
    expect(paths).not.toContain('node_modules/');
  });

  test('partial로 필터링된다', async () => {
    const res = await request(app).get(`/suggest?root=${encodeURIComponent(tmpDir)}&partial=src`);
    expect(res.status).toBe(200);
    const paths = res.body.suggestions.map((s: { path: string; display: string; isDir: boolean }) => s.path);
    expect(paths.every((p: string) => p.startsWith('src'))).toBe(true);
  });

  test('스캔되지 않은 루트는 403', async () => {
    const unregistered = path.join(os.tmpdir(), 'pc-never-scanned-root');
    const res = await request(app).get(`/suggest?root=${encodeURIComponent(unregistered)}`);
    expect(res.status).toBe(403);
  });
});

// ─── POST /read ───────────────────────────────────────────────────────

describe('POST /api/mention/read', () => {
  test('유효한 파일 읽기 → content 반환', async () => {
    const res = await request(app).post('/read').send({
      filePath: 'README.md',
      scanRoot: tmpDir,
    });
    expect(res.status).toBe(200);
    expect(res.body.content).toBe('# Project');
    expect(res.body.filePath).toBe('README.md');
  });

  test('filePath 없으면 400', async () => {
    const res = await request(app).post('/read').send({ scanRoot: tmpDir });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('경로 탐색 시도 → 403', async () => {
    const res = await request(app).post('/read').send({
      filePath: '../secret',
      scanRoot: tmpDir,
    });
    expect(res.status).toBe(403);
  });

  test('totalLines, language 응답 필드 포함', async () => {
    const res = await request(app).post('/read').send({
      filePath: 'src/index.ts',
      scanRoot: tmpDir,
    });
    expect(res.status).toBe(200);
    expect(typeof res.body.totalLines).toBe('number');
    expect(res.body.language).toBe('typescript');
  });

  test('lineStart=1, lineEnd=1 → 첫 줄만 반환', async () => {
    fs.writeFileSync(path.join(tmpDir, 'multi.ts'), 'line1\nline2\nline3');
    const res = await request(app).post('/read').send({
      filePath: 'multi.ts',
      scanRoot: tmpDir,
      lineStart: 1,
      lineEnd: 1,
    });
    expect(res.status).toBe(200);
    expect(res.body.content).toBe('line1');
    expect(res.body.lineStart).toBe(1);
    expect(res.body.lineEnd).toBe(1);
  });

  test('lineStart/lineEnd 생략 → 전체 내용 반환', async () => {
    const res = await request(app).post('/read').send({
      filePath: 'README.md',
      scanRoot: tmpDir,
    });
    expect(res.status).toBe(200);
    expect(res.body.content).toBe('# Project');
  });

  test('스캔되지 않은 루트는 403 (validatePath 이전 차단)', async () => {
    const unregistered = path.join(os.tmpdir(), 'pc-never-scanned-root');
    const res = await request(app).post('/read').send({
      filePath: 'README.md',
      scanRoot: unregistered,
    });
    expect(res.status).toBe(403);
  });
});
