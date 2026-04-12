jest.mock('node:fs/promises', () => {
  const actual = jest.requireActual('node:fs/promises');
  return { ...actual, readFile: jest.fn().mockImplementation(actual.readFile) };
});

const request = require('supertest');
const { makeApp } = require('../../helpers/make-app');
const router = require('../../../src/server/routes/cards').default;
const fsMock = require('node:fs/promises');

const app = makeApp(router);

describe('GET /api/cards', () => {
  test('카드 정의 객체 반환', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(typeof res.body).toBe('object');
    expect(res.body).not.toBeNull();
  });

  test('카드 정의에 role 키가 존재한다', async () => {
    const res = await request(app).get('/');
    expect(res.body).toHaveProperty('role');
  });

  test('각 카드에 label, inputType, template 필드가 존재한다', async () => {
    const res = await request(app).get('/');
    for (const card of Object.values(res.body) as any[]) {
      expect(card).toHaveProperty('label');
      expect(card).toHaveProperty('inputType');
      expect(card).toHaveProperty('template');
    }
  });

  test('role과 goal 카드의 required는 true이다', async () => {
    const res = await request(app).get('/');
    expect(res.body.role.required).toBe(true);
    expect(res.body.goal.required).toBe(true);
  });

  test('파일 읽기 실패 시 500 에러 반환', async () => {
    fsMock.readFile.mockRejectedValueOnce(new Error('ENOENT: no such file'));
    const res = await request(app).get('/');
    expect(res.status).toBe(500);
  });
});
