import request from 'supertest';
import * as connection from '../../../src/core/db/connection.js';
import * as db from '../../../src/core/db/index.js';
import router from '../../../src/server/routes/history.js';
import { makeApp } from '../../helpers/make-app.js';

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

  test('X-Total-Count 헤더에 전체 건수 반영', async () => {
    db.history.save(SAMPLE);
    db.history.save({ ...SAMPLE, treeId: 'refactoring' });
    const res = await request(app).get('/');
    expect(res.headers['x-total-count']).toBe('2');
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

// ─── POST / ──────────────────────────────────────────────────────────

describe('POST /api/history', () => {
  const POST_BODY = { treeId: 'feature-impl', situation: '기능 구현', prompt: '새 엔드포인트 추가', answers: { goal: '새 엔드포인트 추가' } };

  test('유효 입력 → 201 + historyId', async () => {
    const res = await request(app).post('/').send(POST_BODY);
    expect(res.status).toBe(201);
    expect(typeof res.body.historyId).toBe('number');
    expect(db.history.findAll()).toHaveLength(1);
  });

  test('동일 트리 최신과 prompt 동일 → 200 skipped, 저장 안 됨', async () => {
    await request(app).post('/').send(POST_BODY);
    const res = await request(app).post('/').send(POST_BODY);
    expect(res.status).toBe(200);
    expect(res.body.skipped).toBe(true);
    expect(db.history.findAll()).toHaveLength(1);
  });

  test('다른 트리면 동일 prompt라도 저장', async () => {
    await request(app).post('/').send(POST_BODY);
    const res = await request(app)
      .post('/')
      .send({ ...POST_BODY, treeId: 'refactoring' });
    expect(res.status).toBe(201);
    expect(db.history.findAll()).toHaveLength(2);
  });

  test('treeId 없으면 400', async () => {
    const res = await request(app).post('/').send({ prompt: 'p', answers: {} });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('prompt 비면 400', async () => {
    const res = await request(app).post('/').send({ treeId: 'feature-impl', prompt: '   ', answers: {} });
    expect(res.status).toBe(400);
  });
});

// ─── DELETE / (전체 삭제) ──────────────────────────────────────────────

describe('DELETE /api/history (clear all)', () => {
  test('전체 삭제 → { deleted: N }, DB 비워짐', async () => {
    db.history.save(SAMPLE);
    db.history.save({ ...SAMPLE, treeId: 'refactoring' });
    const res = await request(app).delete('/');
    expect(res.status).toBe(200);
    expect(res.body.deleted).toBe(2);
    expect(db.history.count()).toBe(0);
  });

  test('빈 DB에서도 성공 → { deleted: 0 }', async () => {
    const res = await request(app).delete('/');
    expect(res.status).toBe(200);
    expect(res.body.deleted).toBe(0);
  });
});
