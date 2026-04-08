import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createHttpServer } from 'node:http';
import { closeConnection, initialize } from '../core/db/index.js';
import { securityHeaders, corsLocalhost } from './middleware/security.js';
import { errorHandler } from './middleware/errorHandler.js';
import browseRouter from './routes/browse.js';
import scanRouter from './routes/scan.js';
import treesRouter from './routes/trees.js';
import cardsRouter from './routes/cards.js';
import promptRouter from './routes/prompt.js';
import historyRouter from './routes/history.js';
import templateRouter from './routes/template.js';
import configRouter from './routes/config.js';
import mentionRouter from './routes/mention.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_DIST = path.join(__dirname, '../../dist/web');

export async function createServer(port: number): Promise<void> {
  await initialize();

  const app = express();

  app.use(securityHeaders);
  app.use(corsLocalhost);
  app.use(express.json({ limit: '5mb' }));

  // API 라우트
  app.use('/api/browse', browseRouter);
  app.use('/api/scan', scanRouter);
  app.use('/api/trees', treesRouter);
  app.use('/api/cards', cardsRouter);
  app.use('/api/prompt', promptRouter);
  app.use('/api/history', historyRouter);
  app.use('/api/templates', templateRouter);
  app.use('/api/config', configRouter);
  app.use('/api/mention', mentionRouter);

  // 정적 파일 서빙 (프로덕션 빌드)
  app.use(express.static(WEB_DIST));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(WEB_DIST, 'index.html'));
  });

  app.use(errorHandler);

  const server = createHttpServer(app);

  await new Promise<void>((resolve) => {
    server.listen(port, '127.0.0.1', resolve);
  });

  // Graceful Shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n[${signal}] 서버를 종료합니다...`);
    server.close(() => {
      closeConnection();
      process.exit(0);
    });
    // 10초 후 강제 종료
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

// 직접 실행 시 서버 시작 (tsx watch src/server/index.ts)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const PORT = Number(process.env.PORT ?? 3000);
  createServer(PORT)
    .then(() => console.log(`[server] http://localhost:${PORT}`))
    .catch((err) => {
      console.error('[server] 시작 실패:', err);
      process.exit(1);
    });
}
