import type { Request, Response } from 'express';

const { securityHeaders, corsLocalhost, hostGuard } = require('../../../src/server/middleware/security');

function makeRes() {
  const headers: Record<string, string> = {};
  const res = {
    headers,
    statusCode: 200,
    setHeader: jest.fn((k: string, v: string) => {
      headers[k] = v;
    }),
    sendStatus: jest.fn(),
    status: jest.fn((code: number) => {
      res.statusCode = code;
      return res;
    }),
    json: jest.fn(),
  };
  return res;
}

function makeReq(overrides: Partial<Request> = {}) {
  return { headers: {}, method: 'GET', ...overrides };
}

// ─── securityHeaders ─────────────────────────────────────────────────

describe('securityHeaders()', () => {
  test('보안 헤더 3개를 설정한다', () => {
    const res = makeRes();
    const next = jest.fn();
    securityHeaders({} as unknown as Request, res as unknown as Response, next);
    expect(res.setHeader).toHaveBeenCalledWith('Content-Security-Policy', expect.stringContaining("default-src 'self'"));
    expect(res.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
    expect(res.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
  });

  test('next()를 호출한다', () => {
    const res = makeRes();
    const next = jest.fn();
    securityHeaders({} as unknown as Request, res as unknown as Response, next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});

// ─── corsLocalhost ───────────────────────────────────────────────────

describe('corsLocalhost(port)', () => {
  const cors = corsLocalhost(3000);

  test('자기 포트 localhost origin에 CORS 헤더를 설정한다', () => {
    const req = makeReq({ headers: { origin: 'http://localhost:3000' } });
    const res = makeRes();
    const next = jest.fn();
    cors(req as unknown as Request, res as unknown as Response, next);
    expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'http://localhost:3000');
    expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', expect.stringContaining('GET'));
    expect(res.setHeader).toHaveBeenCalledWith('Vary', 'Origin');
    expect(next).toHaveBeenCalled();
  });

  test('자기 포트 127.0.0.1 origin도 허용한다', () => {
    const req = makeReq({ headers: { origin: 'http://127.0.0.1:3000' } });
    const res = makeRes();
    const next = jest.fn();
    cors(req as unknown as Request, res as unknown as Response, next);
    expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'http://127.0.0.1:3000');
  });

  test('다른 포트의 localhost origin은 거부한다(confused deputy 방지)', () => {
    const req = makeReq({ headers: { origin: 'http://localhost:9999' } });
    const res = makeRes();
    const next = jest.fn();
    cors(req as unknown as Request, res as unknown as Response, next);
    expect(res.setHeader).not.toHaveBeenCalledWith('Access-Control-Allow-Origin', expect.anything());
    expect(next).toHaveBeenCalled();
  });

  test('외부 origin은 CORS 헤더를 설정하지 않는다', () => {
    const req = makeReq({ headers: { origin: 'https://evil.com' } });
    const res = makeRes();
    const next = jest.fn();
    cors(req as unknown as Request, res as unknown as Response, next);
    expect(res.setHeader).not.toHaveBeenCalledWith('Access-Control-Allow-Origin', expect.anything());
    expect(next).toHaveBeenCalled();
  });

  test('origin 헤더 없으면 CORS 헤더 없이 next() 호출', () => {
    const req = makeReq({ headers: {} });
    const res = makeRes();
    const next = jest.fn();
    cors(req as unknown as Request, res as unknown as Response, next);
    expect(res.setHeader).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  test('OPTIONS 요청은 204를 반환하고 next()를 호출하지 않는다', () => {
    const req = makeReq({ method: 'OPTIONS', headers: { origin: 'http://localhost:3000' } });
    const res = makeRes();
    const next = jest.fn();
    cors(req as unknown as Request, res as unknown as Response, next);
    expect(res.sendStatus).toHaveBeenCalledWith(204);
    expect(next).not.toHaveBeenCalled();
  });
});

// ─── hostGuard ───────────────────────────────────────────────────────

describe('hostGuard(port)', () => {
  const guard = hostGuard(3000);

  test('자기 포트 localhost Host는 통과시킨다', () => {
    const req = makeReq({ headers: { host: 'localhost:3000' } });
    const res = makeRes();
    const next = jest.fn();
    guard(req as unknown as Request, res as unknown as Response, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('자기 포트 127.0.0.1 Host도 통과시킨다', () => {
    const req = makeReq({ headers: { host: '127.0.0.1:3000' } });
    const res = makeRes();
    const next = jest.fn();
    guard(req as unknown as Request, res as unknown as Response, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('다른 포트의 Host는 403으로 거부한다', () => {
    const req = makeReq({ headers: { host: 'localhost:9999' } });
    const res = makeRes();
    const next = jest.fn();
    guard(req as unknown as Request, res as unknown as Response, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'invalid_host' });
    expect(next).not.toHaveBeenCalled();
  });

  test('외부 도메인 Host(rebinding)는 403으로 거부한다', () => {
    const req = makeReq({ headers: { host: 'attacker.com' } });
    const res = makeRes();
    const next = jest.fn();
    guard(req as unknown as Request, res as unknown as Response, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('Host 헤더 부재 시 403으로 거부한다', () => {
    const req = makeReq({ headers: {} });
    const res = makeRes();
    const next = jest.fn();
    guard(req as unknown as Request, res as unknown as Response, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('포트 80에서는 bare 호스트도 허용한다', () => {
    const guard80 = hostGuard(80);
    const req = makeReq({ headers: { host: 'localhost' } });
    const res = makeRes();
    const next = jest.fn();
    guard80(req as unknown as Request, res as unknown as Response, next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
