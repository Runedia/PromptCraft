import express from 'express';
import request from 'supertest';
import * as connection from '../../../src/core/db/connection.js';
import * as db from '../../../src/core/db/index.js';
import type { PromptAnswers } from '../../../src/core/types.js';
import { errorHandler } from '../../../src/server/middleware/errorHandler.js';
import router from '../../../src/server/routes/transfer.js';
import { makeApp } from '../../helpers/make-app.js';

const app = makeApp(router);
const ANSWERS = {} as PromptAnswers;

beforeEach(() => {
  connection.initialize(':memory:');
});

afterEach(() => {
  connection.closeConnection();
});

describe('GET /export', () => {
  test('번들 + attachment 헤더 반환', async () => {
    db.history.save({ treeId: 't1', situation: 's', prompt: 'p', scanPath: null, answers: ANSWERS });
    const res = await request(app).get('/export');
    expect(res.status).toBe(200);
    expect(res.headers['content-disposition']).toMatch(/attachment; filename="promptcraft-export-\d{8}\.json"/);
    expect(res.body.format).toBe('promptcraft-export');
    expect(res.body.schemaVersion).toBe(db.SCHEMA_VERSION);
    expect(res.body.history.length).toBe(1);
  });
});

describe('POST /import', () => {
  // 주의: 테스트 번들의 globalConfig는 반드시 빈 객체 — 비어 있지 않으면 실제 ~/.promptcraft/config.json에 쓴다.
  const bundle = {
    format: 'promptcraft-export',
    formatVersion: 1,
    schemaVersion: 1,
    exportedAt: '2026-06-10T00:00:00.000Z',
    history: [{ id: 99, treeId: 't1', situation: 's', prompt: 'p', scanPath: null, answers: {}, createdAt: '2026-06-09 12:00:00' }],
    dbConfig: [],
    globalConfig: {},
  };

  test('유효 번들 → 병합 결과 반환', async () => {
    const res = await request(app).post('/import').send(bundle);
    expect(res.status).toBe(200);
    expect(res.body.historyAdded).toBe(1);
    expect(db.history.count()).toBe(1);
  });

  test('format 불일치 → 400', async () => {
    const res = await request(app)
      .post('/import')
      .send({ ...bundle, format: 'nope' });
    expect(res.status).toBe(400);
    expect(db.history.count()).toBe(0);
  });

  test('schemaVersion 초과 → 400', async () => {
    const res = await request(app)
      .post('/import')
      .send({ ...bundle, schemaVersion: db.SCHEMA_VERSION + 1 });
    expect(res.status).toBe(400);
  });
});

function makeProductionOrderApp() {
  const app = express();
  // 프로덕션(src/server/index.ts) 순서 재현: transfer 라우터가 전역 json(5mb)보다 먼저
  app.use('/api', router);
  app.use(express.json({ limit: '5mb' }));
  app.use(errorHandler);
  return app;
}

describe('POST /api/import — 프로덕션 마운트 순서 (50mb limit)', () => {
  test('5mb 초과 번들도 수용 (라우트 전용 limit이 적용됨)', async () => {
    const bigPrompt = 'x'.repeat(1024 * 1024);
    const history = Array.from({ length: 6 }, (_, i) => ({
      id: i + 1,
      treeId: 't1',
      situation: 's',
      prompt: `${bigPrompt}${i}`,
      scanPath: null,
      answers: {},
      createdAt: `2026-06-09 12:00:0${i}`,
    }));
    const res = await request(makeProductionOrderApp()).post('/api/import').send({
      format: 'promptcraft-export',
      formatVersion: 1,
      schemaVersion: 1,
      exportedAt: '2026-06-10T00:00:00.000Z',
      history,
      dbConfig: [],
      globalConfig: {},
    });
    expect(res.status).toBe(200); // 마운트 순서가 깨지면 전역 5mb가 먼저 파싱해 413
    expect(res.body.historyAdded).toBe(6);
  });

  test('깨진 JSON 본문 → 400 (errorHandler가 body-parser status 반영)', async () => {
    const res = await request(makeProductionOrderApp()).post('/api/import').set('Content-Type', 'application/json').send('{broken');
    expect(res.status).toBe(400);
  });
});
