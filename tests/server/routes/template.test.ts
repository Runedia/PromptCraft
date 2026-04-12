jest.mock('../../../src/core/db/index', () => {
  const actual = jest.requireActual('../../../src/core/db/index');
  return { ...actual, initialize: jest.fn().mockResolvedValue(undefined) };
});

const request = require('supertest');
const { makeApp } = require('../../helpers/make-app');
const router = require('../../../src/server/routes/template').default;
const connection = require('../../../src/core/db/connection');
const db = require('../../../src/core/db');

const app = makeApp(router);

const SAMPLE_INPUT = {
  name: '백엔드 기본 템플릿',
  treeId: 'feature-impl',
  answers: { role: '백엔드 개발자', goal: 'REST API 구현' },
};

beforeEach(() => {
  connection.initialize(':memory:');
});

afterEach(() => {
  connection.closeConnection();
});

// ─── GET / ───────────────────────────────────────────────────────────

describe('GET /api/templates', () => {
  test('빈 DB → 빈 배열', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('저장된 템플릿 목록 반환', async () => {
    db.template.save(SAMPLE_INPUT);
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe(SAMPLE_INPUT.name);
  });
});

// ─── POST / ──────────────────────────────────────────────────────────

describe('POST /api/templates', () => {
  test('유효한 입력 → 201 + 저장된 템플릿 반환', async () => {
    const res = await request(app).post('/').send(SAMPLE_INPUT);
    expect(res.status).toBe(201);
    expect(res.body.name).toBe(SAMPLE_INPUT.name);
    expect(res.body.treeId).toBe(SAMPLE_INPUT.treeId);
  });

  test('name 없으면 400', async () => {
    const res = await request(app).post('/').send({ treeId: 'feature-impl', answers: {} });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('treeId 없으면 400', async () => {
    const res = await request(app).post('/').send({ name: '이름', answers: {} });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});

// ─── DELETE /:id ─────────────────────────────────────────────────────

describe('DELETE /api/templates/:id', () => {
  test('삭제 → { success: true }', async () => {
    const id = db.template.save(SAMPLE_INPUT);
    const res = await request(app).delete(`/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(db.template.findById(Number(id))).toBeNull();
  });
});
