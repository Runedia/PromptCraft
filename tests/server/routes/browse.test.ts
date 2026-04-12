import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const request = require('supertest');
const { makeApp } = require('../../helpers/make-app');
const router = require('../../../src/server/routes/browse').default;

const app = makeApp(router);

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'browse-test-'));
  fs.mkdirSync(path.join(tmpDir, 'src'));
  fs.mkdirSync(path.join(tmpDir, 'tests'));
  fs.mkdirSync(path.join(tmpDir, '.hidden'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ─── GET /?path=... ───────────────────────────────────────────────────

describe('GET /api/browse', () => {
  test('path 없으면 루트 목록 반환 (isRoot=true)', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.isRoot).toBe(true);
    expect(Array.isArray(res.body.dirs)).toBe(true);
  });

  test('유효한 디렉토리 경로 → 하위 디렉토리 목록 반환', async () => {
    const res = await request(app).get(`/?path=${encodeURIComponent(tmpDir)}`);
    expect(res.status).toBe(200);
    expect(res.body.current).toBe(path.resolve(tmpDir));
    expect(res.body.dirs).toContain(path.join(tmpDir, 'src'));
    expect(res.body.dirs).toContain(path.join(tmpDir, 'tests'));
  });

  test('점으로 시작하는 숨김 디렉토리는 제외된다', async () => {
    const res = await request(app).get(`/?path=${encodeURIComponent(tmpDir)}`);
    expect(res.body.dirs).not.toContain(path.join(tmpDir, '.hidden'));
  });

  test('parent 경로가 포함된다', async () => {
    const res = await request(app).get(`/?path=${encodeURIComponent(tmpDir)}`);
    expect(res.body.parent).toBe(path.dirname(tmpDir));
    expect(res.body.isRoot).toBe(false);
  });

  test('유효하지 않은 경로 → 400', async () => {
    const res = await request(app).get(`/?path=${encodeURIComponent('/nonexistent/path/xyz')}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('파일 경로(디렉토리 아님) 전달 시 400 반환', async () => {
    const filePath = path.join(tmpDir, 'file.txt');
    fs.writeFileSync(filePath, 'content');
    const res = await request(app).get(`/?path=${encodeURIComponent(filePath)}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});
