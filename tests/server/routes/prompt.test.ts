import request from 'supertest';
import * as connection from '../../../src/core/db/connection.js';
import * as db from '../../../src/core/db/index.js';
import type { SectionCard } from '../../../src/core/types/card.js';
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
