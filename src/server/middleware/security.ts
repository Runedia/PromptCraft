import type { NextFunction, Request, Response } from 'express';

export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self'; connect-src 'self'; img-src 'self' data:;"
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
}

/** 서버가 바인딩된 포트의 정확한 localhost 오리진만 허용한다(와일드카드 포트 금지). */
function allowedOrigins(port: number): Set<string> {
  return new Set([`http://localhost:${port}`, `http://127.0.0.1:${port}`]);
}

/** 허용 Host 값. 비기본 포트는 항상 `host:port` 형태로 전달되며, 포트 80에서만 bare 호스트가 등장한다. */
function allowedHosts(port: number): Set<string> {
  const hosts = [`localhost:${port}`, `127.0.0.1:${port}`];
  if (port === 80) hosts.push('localhost', '127.0.0.1');
  return new Set(hosts);
}

/**
 * DNS rebinding 방어: Host 헤더가 바인딩 포트의 localhost가 아니면 거부한다.
 * 외부 도메인이 127.0.0.1로 rebinding되어도 브라우저가 보내는 Host는 공격자 도메인이므로 차단된다.
 */
export function hostGuard(port: number) {
  const hosts = allowedHosts(port);
  return (req: Request, res: Response, next: NextFunction): void => {
    const host = req.headers.host;
    if (!host || !hosts.has(host)) {
      res.status(403).json({ error: 'invalid_host' });
      return;
    }
    next();
  };
}

/**
 * CORS: 서버 자기 포트의 localhost 오리진만 허용한다.
 * 와일드카드 localhost를 허용하지 않으므로, 동일 머신의 다른 포트에서 동작하는 악성 오리진의
 * cross-origin 요청이 preflight에서 차단된다(confused deputy 방지). dev는 Vite가 /api를 프록시하여
 * 브라우저가 same-origin으로만 통신하므로 영향받지 않는다.
 */
export function corsLocalhost(port: number) {
  const origins = allowedOrigins(port);
  return (req: Request, res: Response, next: NextFunction): void => {
    const origin = req.headers.origin;
    if (origin && origins.has(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Vary', 'Origin');
    }
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  };
}
