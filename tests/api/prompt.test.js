'use strict';
const request = require('supertest');
const { createApp } = require('../../src/api/server');

let app;

beforeAll(() => {
  app = createApp();
});

describe('POST /api/prompt/build', () => {
  test('프롬프트 섹션 포맷 확인', async () => {
    // 세션 생성 및 전체 답변 제출
    const { body: { sessionId } } = await request(app)
      .post('/api/qna/session')
      .send({ treeId: 'error-solving' });

    const answers = [
      '시니어 Python 개발자',       // role
      'ValueError 해결',             // goal
      '데이터 파싱 중 에러 발생',    // currentSituation
      'ValueError: invalid literal', // errorEvidence
      '',                            // triedMethods (optional)
      '',                            // constraints (optional)
    ];

    for (const ans of answers) {
      await request(app).post(`/api/qna/${sessionId}/answer`).send({ value: ans });
    }

    // 프롬프트 빌드
    const res = await request(app)
      .post('/api/prompt/build')
      .send({ sessionId });

    expect(res.status).toBe(200);
    expect(res.body.prompt).toContain('## Role');
    expect(res.body.prompt).toContain('## Goal');
    expect(res.body.prompt).toContain('## Current Situation');
    expect(res.body.prompt).toContain('## Error / Evidence');
    expect(res.body.prompt).toContain('## Constraints');
    expect(res.body.tokenEstimate).toBeGreaterThan(0);
  });
});
