import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import request from 'supertest';
import * as connection from '../../src/core/db/connection.js';
import * as db from '../../src/core/db/index.js';
import { LANG_KEY } from '../../src/server/locale.js';
import router from '../../src/server/routes/locale.js';
import { makeApp } from '../helpers/make-app.js';

const app = makeApp(router);

beforeEach(() => {
  connection.initialize(':memory:');
});

afterEach(() => {
  connection.closeConnection();
});

describe('GET /api/locale', () => {
  test('ui.language 미설정 → OS 감지 결과 반환 (ko 또는 en)', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(['ko', 'en']).toContain(res.body.lang);
  });

  test('ui.language="en" 저장 후 → "en" 반환', async () => {
    db.config.set(LANG_KEY, 'en');
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.lang).toBe('en');
  });

  test('ui.language="ko" 저장 후 → "ko" 반환', async () => {
    db.config.set(LANG_KEY, 'ko');
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.lang).toBe('ko');
  });

  test('ui.language 지원하지 않는 값("fr") → OS 감지 결과 반환', async () => {
    db.config.set(LANG_KEY, 'fr');
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(['ko', 'en']).toContain(res.body.lang);
  });

  test('응답에 lang 키가 존재한다', async () => {
    const res = await request(app).get('/');
    expect(res.body).toHaveProperty('lang');
  });
});
