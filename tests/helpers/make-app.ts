const express = require('express');

/** 테스트용 최소 Express 앱 팩토리. 에러 핸들러 포함. */
function makeApp(router: any) {
  const app = express();
  app.use(express.json());
  app.use(router);
  app.use((err: any, _req: any, res: any, _next: any) => {
    res.status(500).json({ error: err.message });
  });
  return app;
}

module.exports = { makeApp };
