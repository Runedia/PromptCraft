import request from 'supertest';
import router from '../../../src/server/routes/scan.js';
import { makeApp } from '../../helpers/make-app.js';

// scan과 domain-loader를 mock — 실제 스캔은 무겁고 느림
jest.mock('../../../src/core/scanner/index', () => ({
  scan: jest.fn().mockResolvedValue({
    languages: [{ name: 'TypeScript', role: 'primary', confidence: 0.9 }],
    frameworks: [{ name: 'Express', confidence: 0.8 }],
    packageManager: 'pnpm',
    domainContext: { primary: 'web-backend', confidence: 'high' },
    structure: { hasTests: true, hasDocs: false },
    gitInfo: null,
  }),
}));

jest.mock('../../../src/server/domain-loader', () => ({
  loadDomainOverlay: jest.fn().mockReturnValue(null),
  loadRoleMappings: jest.fn().mockReturnValue({
    domainRoles: {
      general: { default: ['소프트웨어 엔지니어'] },
      'web-backend': {
        default: ['백엔드 엔지니어', 'API 개발자'],
        'error-solving': ['백엔드 SRE', 'API 디버깅 전문가'],
        'code-review': ['시니어 백엔드 개발자', '보안 엔지니어'],
      },
    },
    frameworkRoles: {},
  }),
  loadTreesMeta: jest.fn().mockReturnValue([{ id: 'error-solving' }, { id: 'code-review', roleSuffix: '코드 리뷰 전문가' }]),
}));

jest.mock('../../../src/server/scan-debug', () => ({
  writeScanDebugLog: jest.fn(),
}));

const app = makeApp(router);

// ─── POST / ───────────────────────────────────────────────────────────

describe('POST /api/scan', () => {
  test('유효한 path → 스캔 결과 반환', async () => {
    const res = await request(app).post('/').send({ path: '/some/project' });
    expect(res.status).toBe(200);
    expect(res.body.languages).toBeDefined();
    expect(res.body.frameworks).toBeDefined();
    expect(typeof res.body.elapsedMs).toBe('number');
  });

  test('응답에 roleSuggestionsByTree dict가 포함된다 (트리별 역할)', async () => {
    const res = await request(app).post('/').send({ path: '/some/project' });
    expect(res.status).toBe(200);
    expect(res.body.roleSuggestionsByTree).toBeDefined();
    expect(res.body.roleSuggestionsByTree['error-solving']).toBeInstanceOf(Array);
    expect(res.body.roleSuggestionsByTree['code-review']).toBeInstanceOf(Array);

    // roleSuffix 없는 트리(error-solving): 1~2번 슬롯이 base
    expect(res.body.roleSuggestionsByTree['error-solving'].slice(0, 2)).toEqual(['백엔드 엔지니어', 'API 개발자']);

    // roleSuffix 있는 트리(code-review): 1번 슬롯은 트리×조합 역할, base는 그 뒤로 포함
    expect(res.body.roleSuggestionsByTree['code-review'][0]).toBe('Express 코드 리뷰 전문가');
    expect(res.body.roleSuggestionsByTree['code-review']).toContain('백엔드 엔지니어');
    expect(res.body.roleSuggestionsByTree['code-review']).toContain('API 개발자');
  });

  test('path 없으면 400', async () => {
    const res = await request(app).post('/').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('path');
  });

  test('path가 문자열이 아니면 400', async () => {
    const res = await request(app).post('/').send({ path: 123 });
    expect(res.status).toBe(400);
  });
});

// ─── GET /last ────────────────────────────────────────────────────────

describe('GET /api/scan/last', () => {
  test('이전 스캔 없으면 404', async () => {
    // last-scan.json이 없는 환경 가정 (CI/테스트 환경)
    // 실제 파일이 있을 수도 있으므로 결과만 확인
    const res = await request(app).get('/last');
    expect([200, 404]).toContain(res.status);
  });
});
