import type { NextFunction, Request, Response } from 'express';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('[Server Error]', err.message);
  // body-parser 등 미들웨어 에러는 status를 싣는다(400 parse.failed, 413 too.large) — 없으면 500.
  const maybeStatus = (err as { status?: unknown }).status;
  const status = typeof maybeStatus === 'number' ? maybeStatus : 500;
  res.status(status).json({ error: err.message ?? '서버 오류가 발생했습니다.' });
}
