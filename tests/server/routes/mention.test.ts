import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const request = require('supertest');
const { makeApp } = require('../../helpers/make-app');
const router = require('../../../src/server/routes/mention').default;

const app = makeApp(router);

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mention-test-'));
  fs.mkdirSync(path.join(tmpDir, 'src'));
  fs.writeFileSync(path.join(tmpDir, 'src', 'index.ts'), 'export {}');
  fs.writeFileSync(path.join(tmpDir, 'README.md'), '# Project');
  fs.mkdirSync(path.join(tmpDir, 'node_modules'));
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
    const paths = res.body.suggestions.map((s: any) => s.path);
    expect(paths).not.toContain('node_modules/');
  });

  test('partial로 필터링된다', async () => {
    const res = await request(app).get(`/suggest?root=${encodeURIComponent(tmpDir)}&partial=src`);
    expect(res.status).toBe(200);
    const paths = res.body.suggestions.map((s: any) => s.path);
    expect(paths.every((p: string) => p.startsWith('src'))).toBe(true);
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
});
