import type { NextFunction, Request, Response, Router } from 'express';
import express from 'express';

/** 테스트용 최소 Express 앱 팩토리. 에러 핸들러 포함. */
function makeApp(router: Router) {
  const app = express();
  app.use(express.json());
  app.use(router);
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({ error: err.message });
  });
  return app;
}

export { makeApp };
