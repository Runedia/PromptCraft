import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import * as connection from '../../../src/core/db/connection.js';
import * as db from '../../../src/core/db/index.js';
import type { SectionCard } from '../../../src/core/types/card.js';
import * as refineService from '../../../src/server/refine/refineService.js';
import router from '../../../src/server/routes/prompt.js';
import { makeApp } from '../../helpers/make-app.js';

const app = makeApp(router);

function makeCard(overrides: Partial<SectionCard> = {}) {
  return {
    id: 'goal',
    label: '목표',
    required: false,
    active: true,
    order: 1,
    inputType: 'text',
    value: '테스트 목표',
    template: '## 목표\n{{value}}',
    scanSuggested: false,
    ...overrides,
  };
}

beforeEach(() => {
  connection.initialize(':memory:');
});

afterEach(() => {
  connection.closeConnection();
});

// ─── POST /build ──────────────────────────────────────────────────────

describe('POST /api/prompt/build', () => {
  test('cards 배열로 프롬프트 빌드 → prompt + tokenEstimate 반환', async () => {
    const cards = [makeCard({ value: '새 기능 개발', template: '## 목표\n{{value}}' })];
    const res = await request(app).post('/build').send({ cards, treeId: 'feature-impl', saveToHistory: false });
    expect(res.status).toBe(200);
    expect(res.body.prompt).toContain('새 기능 개발');
    expect(typeof res.body.tokenEstimate).toBe('number');
    expect(res.body.historyId).toBeUndefined();
  });

  test('cards가 배열이 아니면 400', async () => {
    const res = await request(app).post('/build').send({ cards: 'invalid', treeId: 'x', saveToHistory: false });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('saveToHistory=true이고 prompt가 있으면 히스토리 저장', async () => {
    const cards = [makeCard({ value: '기능 목표', template: '{{value}}' })];
    const res = await request(app).post('/build').send({ cards, treeId: 'feature-impl', saveToHistory: true });
    expect(res.status).toBe(200);
    expect(typeof res.body.historyId).toBe('number');
    expect(db.history.count()).toBe(1);
  });

  test('active=false 카드는 프롬프트에서 제외', async () => {
    const cards = [
      makeCard({ id: 'a', active: true, value: '포함', template: '{{value}}' }),
      makeCard({ id: 'b', active: false, value: '제외', template: '{{value}}' }),
    ];
    const res = await request(app).post('/build').send({ cards, treeId: 'feature-impl', saveToHistory: false });
    expect(res.body.prompt).toContain('포함');
    expect(res.body.prompt).not.toContain('제외');
  });
});

// ─── GET /providers ───────────────────────────────────────────────────
describe('GET /api/prompt/providers', () => {
  test('provider별 설치 여부 맵 반환', async () => {
    const whichSpy = spyOn(Bun, 'which').mockImplementation((b: string) => (b === 'claude' ? '/x/claude' : null));
    const res = await request(app).get('/providers');
    expect(res.status).toBe(200);
    expect(res.body['claude-code']).toBe(true);
    expect(res.body.gemini).toBe(false);
    whichSpy.mockRestore();
  });
});

// ─── POST /run ────────────────────────────────────────────────────────
describe('POST /api/prompt/run', () => {
  test('화이트리스트 외 target → 400 invalid_target', async () => {
    const res = await request(app).post('/run').send({ target: 'evil', cwd: os.tmpdir() });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid_target');
  });

  test('존재하지 않는 cwd → 400 invalid_cwd', async () => {
    const res = await request(app)
      .post('/run')
      .send({ target: 'claude-code', cwd: path.join(os.tmpdir(), `__pc_nonexistent_${Date.now()}`) });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid_cwd');
  });

  test('미설치 → 409 not_installed', async () => {
    const whichSpy = spyOn(Bun, 'which').mockReturnValue(null);
    const res = await request(app).post('/run').send({ target: 'claude-code', cwd: os.tmpdir() });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('not_installed');
    expect(res.body.bin).toBe('claude');
    whichSpy.mockRestore();
  });

  test('정상 → 200 ok + spawn 호출', async () => {
    const whichSpy = spyOn(Bun, 'which').mockReturnValue('/x/claude');
    const spawnSpy = spyOn(Bun, 'spawn').mockReturnValue({ unref() {} } as unknown as never);
    const res = await request(app).post('/run').send({ target: 'claude-code', cwd: os.tmpdir() });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, launched: 'claude' });
    expect(spawnSpy).toHaveBeenCalledTimes(1);
    expect(spawnSpy.mock.calls[0][0]).toEqual(['cmd.exe', '/c', 'start', '', 'cmd', '/k', 'claude']);
    whichSpy.mockRestore();
    spawnSpy.mockRestore();
  });

  test('spawn 예외 시 → 500 launch_failed', async () => {
    const whichSpy = spyOn(Bun, 'which').mockReturnValue('/x/claude');
    const spawnSpy = spyOn(Bun, 'spawn').mockImplementation(() => {
      throw new Error('boom');
    });
    const res = await request(app).post('/run').send({ target: 'claude-code', cwd: os.tmpdir() });
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('launch_failed');
    whichSpy.mockRestore();
    spawnSpy.mockRestore();
  });
});

// ─── POST /structural ─────────────────────────────────────────────────
describe('POST /api/prompt/structural', () => {
  test('채워진 카드 → completeness>0, belowThreshold 플래그', async () => {
    const cards = [makeCard({ value: '새 기능' })];
    const res = await request(app).post('/structural').send({ cards });
    expect(res.status).toBe(200);
    expect(res.body.completeness).toBeGreaterThan(0);
    expect(typeof res.body.belowThreshold).toBe('boolean');
    expect(Array.isArray(res.body.missing)).toBe(true);
  });

  test('cards 비배열 → 400', async () => {
    const res = await request(app).post('/structural').send({ cards: 'x' });
    expect(res.status).toBe(400);
  });
});

// ─── POST /refine ─────────────────────────────────────────────────────
describe('POST /api/prompt/refine', () => {
  test('모델 미설정 → 409 no_model', async () => {
    const res = await request(app)
      .post('/refine')
      .send({ cards: [makeCard({ value: 'x' })], treeId: 't', lang: 'ko' });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('no_model');
  });

  test('모델 설정 시 assessPrompt 결과 반환', async () => {
    const { config } = await import('../../../src/core/db/index.js');
    config.set('refine.model', 'm1');
    const spy = spyOn(refineService, 'assessPrompt').mockResolvedValue({ level: 'L3', quality: 70, dimensions: [], verdict: 'polished', refined: '다듬음' });
    const res = await request(app)
      .post('/refine')
      .send({ cards: [makeCard({ value: 'x' })], treeId: 't', lang: 'ko' });
    expect(res.status).toBe(200);
    expect(res.body.verdict).toBe('polished');
    expect(res.body.refined).toBe('다듬음');
    expect(typeof res.body.completeness).toBe('number');
    spy.mockRestore();
  });
});
