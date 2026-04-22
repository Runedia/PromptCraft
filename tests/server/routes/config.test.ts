import request from 'supertest';
import * as connection from '../../../src/core/db/connection.js';
import * as db from '../../../src/core/db/index.js';
import router from '../../../src/server/routes/config.js';
import { makeApp } from '../../helpers/make-app.js';

const app = makeApp(router);

beforeEach(() => {
  connection.initialize(':memory:');
});

afterEach(() => {
  connection.closeConnection();
});

// ─── GET / ───────────────────────────────────────────────────────────

describe('GET /api/config', () => {
  test('빈 DB → 빈 객체 반환', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({});
  });

  test('저장된 설정 반환', async () => {
    db.config.set('theme', 'dark');
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.theme).toBe('dark');
  });
});

// ─── PUT / ───────────────────────────────────────────────────────────

describe('PUT /api/config', () => {
  test('설정 일괄 저장 → { success: true }', async () => {
    const res = await request(app).put('/').send({ lang: 'ko', theme: 'light' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(db.config.get('lang')).toBe('ko');
    expect(db.config.get('theme')).toBe('light');
  });

  test('빈 body도 성공 처리', async () => {
    const res = await request(app).put('/').send({});
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('body가 null이면 500 에러 반환', async () => {
    const res = await request(app).put('/').set('Content-Type', 'application/json').send('null');
    expect(res.status).toBe(500);
  });
});
