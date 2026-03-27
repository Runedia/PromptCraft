'use strict';
const request = require('supertest');
const { createApp } = require('../../src/api/server');

let app;

beforeAll(async () => {
  app = createApp();
});

describe('GET /api/trees', () => {
  test('4개 트리 반환', async () => {
    const res = await request(app).get('/api/trees');
    expect(res.status).toBe(200);
    expect(res.body.trees).toHaveLength(4);
    expect(res.body.trees.map(t => t.id)).toContain('error-solving');
  });
});
