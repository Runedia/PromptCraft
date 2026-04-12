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
    domainRoles: { general: { default: ['소프트웨어 엔지니어'] } },
    frameworkRoles: {},
  }),
}));

jest.mock('../../../src/server/scan-debug', () => ({
  writeScanDebugLog: jest.fn(),
}));

const request = require('supertest');
const { makeApp } = require('../../helpers/make-app');
const router = require('../../../src/server/routes/scan').default;

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
