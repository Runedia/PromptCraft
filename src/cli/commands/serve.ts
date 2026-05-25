import net from 'node:net';
import { Command } from 'commander';
import { createServer } from '../../server/index.js';
import { resolveLang } from '../../server/locale.js';
import { detectLocale } from '../../shared/i18n/detectLocale.js';
import { t } from '../../shared/i18n/t.js';

// .description() / .option() 은 module-load 시 평가되므로 OS 로케일(detectLocale)을 사용한다.
// action 내부는 DB 접근 가능 시점이므로 resolveLang() (config 우선)을 사용한다.
const _initLang = detectLocale();

export const serveCommand = new Command('serve')
  .description(t('cli.serveDescription', _initLang))
  .option('-p, --port <number>', t('cli.portOption', _initLang), '3000')
  .option('--no-open', t('cli.noOpenOption', _initLang))
  .action(async (opts: { port: string; open: boolean }) => {
    const lang = resolveLang();
    const startPort = Number(opts.port);
    const port = await findAvailablePort(startPort, lang);

    if (port !== startPort) {
      console.log(t('cli.portInUse', lang, { start: startPort, port }));
    }

    await createServer(port);
    const url = `http://localhost:${port}`;
    console.log(t('cli.runUrl', lang, { url }));

    if (opts.open) {
      const { default: open } = await import('open');
      await open(url);
    }
  });

async function findAvailablePort(start: number, lang: ReturnType<typeof resolveLang>, maxAttempts = 10): Promise<number> {
  for (let i = 0; i < maxAttempts; i++) {
    const port = start + i;
    const available = await isPortAvailable(port);
    if (available) return port;
  }
  throw new Error(t('cli.portNotFound', lang, { start, end: start + maxAttempts - 1 }));
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
