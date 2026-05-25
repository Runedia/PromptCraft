import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import request from 'supertest';
import * as connection from '../../../src/core/db/connection.js';
import { config } from '../../../src/core/db/index.js';
import router from '../../../src/server/routes/llm.js';
import { makeApp } from '../../helpers/make-app.js';

const app = makeApp(router);
beforeEach(() => connection.initialize(':memory:'));
afterEach(() => connection.closeConnection());

describe('GET /api/llm/status', () => {
  test('모델 미설정 + 엔드포인트 미도달 → available false', async () => {
    config.set('refine.baseUrl', 'http://127.0.0.1:9/v1');
    const res = await request(app).get('/status');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ available: false, models: [], configuredModel: null });
  });

  test('모델 설정 + 엔드포인트 미도달 → available false (예외 흡수)', async () => {
    config.set('refine.model', 'm1');
    config.set('refine.baseUrl', 'http://127.0.0.1:9/v1'); // 도달 불가 포트
    const res = await request(app).get('/status');
    expect(res.status).toBe(200);
    expect(res.body.available).toBe(false);
    expect(res.body.configuredModel).toBe('m1');
  });
});
