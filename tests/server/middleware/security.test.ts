import type { Request, Response } from 'express';

const { securityHeaders, corsLocalhost } = require('../../../src/server/middleware/security');

function makeRes() {
  const headers: Record<string, string> = {};
  return {
    headers,
    setHeader: jest.fn((k: string, v: string) => {
      headers[k] = v;
    }),
    sendStatus: jest.fn(),
  };
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

describe('corsLocalhost()', () => {
  test('localhost origin에 CORS 헤더를 설정한다', () => {
    const req = makeReq({ headers: { origin: 'http://localhost:3000' } });
    const res = makeRes();
    const next = jest.fn();
    corsLocalhost(req as unknown as Request, res as unknown as Response, next);
    expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'http://localhost:3000');
    expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', expect.stringContaining('GET'));
    expect(next).toHaveBeenCalled();
  });

  test('127.0.0.1 origin도 허용한다', () => {
    const req = makeReq({ headers: { origin: 'http://127.0.0.1:5173' } });
    const res = makeRes();
    const next = jest.fn();
    corsLocalhost(req as unknown as Request, res as unknown as Response, next);
    expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'http://127.0.0.1:5173');
  });

  test('외부 origin은 CORS 헤더를 설정하지 않는다', () => {
    const req = makeReq({ headers: { origin: 'https://evil.com' } });
    const res = makeRes();
    const next = jest.fn();
    corsLocalhost(req as unknown as Request, res as unknown as Response, next);
    expect(res.setHeader).not.toHaveBeenCalledWith('Access-Control-Allow-Origin', expect.anything());
    expect(next).toHaveBeenCalled();
  });

  test('origin 헤더 없으면 CORS 헤더 없이 next() 호출', () => {
    const req = makeReq({ headers: {} });
    const res = makeRes();
    const next = jest.fn();
    corsLocalhost(req as unknown as Request, res as unknown as Response, next);
    expect(res.setHeader).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  test('OPTIONS 요청은 204를 반환하고 next()를 호출하지 않는다', () => {
    const req = makeReq({ method: 'OPTIONS', headers: { origin: 'http://localhost:3000' } });
    const res = makeRes();
    const next = jest.fn();
    corsLocalhost(req as unknown as Request, res as unknown as Response, next);
    expect(res.sendStatus).toHaveBeenCalledWith(204);
    expect(next).not.toHaveBeenCalled();
  });
});
