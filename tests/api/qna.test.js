'use strict';
const request = require('supertest');
const { createApp } = require('../../src/api/server');

let app;

beforeAll(async () => {
  app = createApp();
});

describe('QnA 세션 플로우', () => {
  test('error-solving 트리 전체 플로우', async () => {
    // 1. 세션 생성
    const sessionRes = await request(app)
      .post('/api/qna/session')
      .send({ treeId: 'error-solving' });
    expect(sessionRes.status).toBe(200);
    expect(sessionRes.body.sessionId).toBeTruthy();
    const { sessionId } = sessionRes.body;

    // 2. 첫 질문 확인 (role)
    const q1 = await request(app).get(`/api/qna/${sessionId}/question`);
    expect(q1.status).toBe(200);
    expect(q1.body.question).toBeTruthy();

    // 3. 답변 제출 (role)
    const a1 = await request(app)
      .post(`/api/qna/${sessionId}/answer`)
      .send({ value: '시니어 Node.js 개발자' });
    expect(a1.status).toBe(200);

    // 4. goal 답변
    await request(app).post(`/api/qna/${sessionId}/answer`).send({ value: '미들웨어 에러 처리' });

    // 5. current-situation
    await request(app).post(`/api/qna/${sessionId}/answer`).send({ value: '에러가 발생합니다' });

    // 6. error-evidence
    await request(app).post(`/api/qna/${sessionId}/answer`).send({ value: 'TypeError: Cannot read...' });

    // 7. tried-methods (optional)
    await request(app).post(`/api/qna/${sessionId}/answer`).send({ value: '' });

    // 8. constraints (optional) - completed
    const last = await request(app).post(`/api/qna/${sessionId}/answer`).send({ value: '' });
    expect(last.status).toBe(200);

    // 9. 세션 삭제
    const del = await request(app).delete(`/api/qna/${sessionId}`);
    expect(del.status).toBe(200);
  });
});
