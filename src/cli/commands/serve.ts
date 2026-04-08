import { Command } from 'commander';
import net from 'node:net';
import { createServer } from '../../server/index.js';

export const serveCommand = new Command('serve')
  .description('웹 UI를 실행합니다 (localhost 전용)')
  .option('-p, --port <number>', '포트 번호', '3000')
  .option('--no-open', '브라우저 자동 실행 비활성화')
  .action(async (opts: { port: string; open: boolean }) => {
    const startPort = Number(opts.port);
    const port = await findAvailablePort(startPort);

    if (port !== startPort) {
      console.log(`포트 ${startPort}가 사용 중입니다. ${port}번으로 실행합니다.`);
    }

    await createServer(port);
    const url = `http://localhost:${port}`;
    console.log(`PromptCraft UI: ${url}`);

    if (opts.open) {
      const { default: open } = await import('open');
      await open(url);
    }
  });

async function findAvailablePort(start: number, maxAttempts = 10): Promise<number> {
  for (let i = 0; i < maxAttempts; i++) {
    const port = start + i;
    const available = await isPortAvailable(port);
    if (available) return port;
  }
  throw new Error(`${start}~${start + maxAttempts - 1} 범위에서 사용 가능한 포트를 찾을 수 없습니다.`);
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, '127.0.0.1');
  });
}
