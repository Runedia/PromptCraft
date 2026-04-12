// initialize를 no-op으로 교체 — 테스트가 :memory: DB를 제어한다
jest.mock('../../../src/core/db/index', () => {
  const actual = jest.requireActual('../../../src/core/db/index');
  return { ...actual, initialize: jest.fn().mockResolvedValue(undefined) };
});

const request = require('supertest');
const { makeApp } = require('../../helpers/make-app');
const router = require('../../../src/server/routes/history').default;
const connection = require('../../../src/core/db/connection');
const db = require('../../../src/core/db');

const app = makeApp(router);

const SAMPLE = {
  treeId: 'feature-impl',
  situation: '기능 구현',
  prompt: '새 API 엔드포인트를 추가해줘.',
  answers: { role: '백엔드 개발자' },
};

beforeEach(() => {
  connection.initialize(':memory:');
});

afterEach(() => {
  connection.closeConnection();
});

// ─── GET / ───────────────────────────────────────────────────────────

describe('GET /api/history', () => {
  test('빈 DB → 빈 배열 반환', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('저장된 레코드 반환', async () => {
    db.history.save(SAMPLE);
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].treeId).toBe('feature-impl');
  });
});

// ─── GET /:id ────────────────────────────────────────────────────────

describe('GET /api/history/:id', () => {
  test('존재하는 id → 레코드 반환', async () => {
    const id = db.history.save(SAMPLE);
    const res = await request(app).get(`/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.prompt).toBe(SAMPLE.prompt);
  });

  test('존재하지 않는 id → 404', async () => {
    const res = await request(app).get('/9999');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});

// ─── DELETE /:id ─────────────────────────────────────────────────────

describe('DELETE /api/history/:id', () => {
  test('정상 삭제 → { success: true }', async () => {
    const id = db.history.save(SAMPLE);
    const res = await request(app).delete(`/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(db.history.findById(id)).toBeNull();
  });

  test('존재하지 않는 id 삭제도 성공 반환', async () => {
    const res = await request(app).delete('/9999');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
