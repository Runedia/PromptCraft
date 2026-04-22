import request from 'supertest';
import router from '../../../src/server/routes/trees.js';
import { makeApp } from '../../helpers/make-app.js';

const app = makeApp(router);

// ─── GET / ───────────────────────────────────────────────────────────

describe('GET /api/trees', () => {
  test('트리 목록 반환 (id, label, description, icon 포함)', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    const tree = res.body[0];
    expect(tree).toHaveProperty('id');
    expect(tree).toHaveProperty('label');
    expect(tree).toHaveProperty('description');
    expect(tree).toHaveProperty('icon');
  });

  test('카드 배열은 목록 응답에 포함되지 않는다', async () => {
    const res = await request(app).get('/');
    for (const tree of res.body) {
      expect(tree).not.toHaveProperty('cardPool');
      expect(tree).not.toHaveProperty('defaultActiveCards');
    }
  });
});

// ─── GET /:treeId ─────────────────────────────────────────────────────

describe('GET /api/trees/:treeId', () => {
  test('존재하는 treeId → tree + cardDefs + roleMappings 반환', async () => {
    const res = await request(app).get('/feature-impl');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('tree');
    expect(res.body).toHaveProperty('cardDefs');
    expect(res.body.tree.id).toBe('feature-impl');
  });

  test('존재하지 않는 treeId → 404', async () => {
    const res = await request(app).get('/nonexistent-tree');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});
