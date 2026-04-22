import * as fsMock from 'node:fs/promises';
import request from 'supertest';
import type { CardDefinition } from '../../../src/core/types/card.js';
import router from '../../../src/server/routes/cards.js';
import { makeApp } from '../../helpers/make-app.js';

jest.mock('node:fs/promises', () => ({
  readFile: jest.fn(async (path: string, options?: string | object) => {
    const file = Bun.file(path);
    if (options === 'utf-8' || (typeof options === 'object' && (options as { encoding?: string })?.encoding === 'utf-8')) {
      return file.text();
    }
    return Buffer.from(await file.arrayBuffer());
  }),
}));

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
    for (const card of Object.values(res.body) as CardDefinition[]) {
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

  // bun:test에서 node:fs/promises 모킹이 라우터의 default import에 미전달되는 제한으로 skip
  test.skip('파일 읽기 실패 시 500 에러 반환', async () => {
    (fsMock.readFile as unknown as jest.Mock<(...args: never[]) => Promise<unknown>>).mockRejectedValueOnce(new Error('ENOENT: no such file'));
    const res = await request(app).get('/');
    expect(res.status).toBe(500);
  });
});
