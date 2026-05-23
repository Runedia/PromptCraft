import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { appendHistory, evaluatePass, formatReport, summarize } from './perf-reporter.js';

const BENCHMARK_NAME = 'graceful-shutdown';
const THRESHOLD_MS = 10_000;
const SERVER_ENTRY = path.join(process.cwd(), 'src', 'server', 'index.ts');

interface ShutdownConfig {
  iterations: number;
  signals: NodeJS.Signals[];
  basePort: number;
  platform: NodeJS.Platform;
}

interface ShutdownIteration {
  signal: NodeJS.Signals;
  port: number;
  elapsedMs: number;
  exitCode: number | null;
  killedAfterTimeout: boolean;
}

function parseIntOrDefault(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

function waitForPort(port: number, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const socket = net.connect({ host: '127.0.0.1', port }, () => {
        socket.end();
        resolve();
      });
      socket.once('error', () => {
        socket.destroy();
        if (Date.now() > deadline) {
          reject(new Error(`port ${port} did not open within ${timeoutMs}ms`));
          return;
        }
        setTimeout(attempt, 200);
      });
    };
    attempt();
  });
}

async function runOnce(signal: NodeJS.Signals, port: number): Promise<ShutdownIteration> {
  const child = spawn('bun', [SERVER_ENTRY], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(port) },
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
  });

  let killedAfterTimeout = false;
  try {
    await waitForPort(port, 30_000);
  } catch (err) {
    child.kill('SIGKILL');
    throw err;
  }

  const start = performance.now();
  const exited = new Promise<number | null>((resolve) => {
    child.once('exit', (code) => resolve(code));
  });

  child.kill(signal);

  const timeout = new Promise<'timeout'>((resolve) => {
    setTimeout(() => resolve('timeout'), THRESHOLD_MS + 2_000).unref();
  });

  const result = await Promise.race([exited, timeout]);
  let exitCode: number | null;
  if (result === 'timeout') {
    killedAfterTimeout = true;
    child.kill('SIGKILL');
    exitCode = await exited;
  } else {
    exitCode = result;
  }
  const elapsed = performance.now() - start;

  return { signal, port, elapsedMs: elapsed, exitCode, killedAfterTimeout };
}

async function run(): Promise<void> {
  const iterations = parseIntOrDefault(process.env.PERF_SHUTDOWN_ITERATIONS, 2);
  const basePort = parseIntOrDefault(process.env.PERF_SHUTDOWN_BASE_PORT, 4090);
  const platform = process.platform;
  const signals: NodeJS.Signals[] = platform === 'win32' ? [] : ['SIGINT', 'SIGTERM'];

  const config: ShutdownConfig = { iterations, signals, basePort, platform };
  const samples: number[] = [];
  const detailed: ShutdownIteration[] = [];
  const notes: string[] = [];

  if (platform === 'win32') {
    notes.push(
      'platform=win32 — process.kill로 보낸 시그널은 Windows에서 graceful 핸들러를 우회한 강제 종료로 동작하므로 본 측정을 skip한다. POSIX(linux/darwin) 환경에서 실측 권장.'
    );
  }

  let cursor = 0;
  for (const signal of signals) {
    for (let i = 0; i < iterations; i += 1) {
      const port = basePort + cursor;
      cursor += 1;
      try {
        const result = await runOnce(signal, port);
        detailed.push(result);
        samples.push(result.elapsedMs);
        if (result.killedAfterTimeout) {
          notes.push(`${signal} iter ${i}: 강제 종료 (>${THRESHOLD_MS}ms)`);
        } else if (result.exitCode !== 0) {
          notes.push(`${signal} iter ${i}: non-zero exit ${result.exitCode}`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        notes.push(`${signal} iter ${i}: ${msg}`);
      }
    }
  }

  const summary = summarize(samples);
  const measured = samples.length > 0;
  const pass =
    platform === 'win32' ? true : measured && evaluatePass(summary.maxMs, THRESHOLD_MS) && detailed.every((d) => d.exitCode === 0 && !d.killedAfterTimeout);

  const entry = {
    executedAt: new Date().toISOString(),
    benchmark: BENCHMARK_NAME,
    thresholdMs: THRESHOLD_MS,
    pass,
    config,
    summary,
    samplesMs: samples.map((v) => Math.round(v * 100) / 100),
    notes: notes.length > 0 ? notes : undefined,
    iterations: detailed.map((d) => ({
      signal: d.signal,
      port: d.port,
      elapsedMs: Math.round(d.elapsedMs * 100) / 100,
      exitCode: d.exitCode,
      killedAfterTimeout: d.killedAfterTimeout,
    })),
  };

  const resultsFile = appendHistory(`${BENCHMARK_NAME}.json`, entry);
  console.log(formatReport(entry, resultsFile));
  if (platform === 'win32') {
    console.log(`[${BENCHMARK_NAME}] SKIP — Windows에서는 process.kill이 graceful 핸들러를 우회한다. POSIX 환경에서 검증할 것.`);
  } else if (!pass) {
    console.warn(`[${BENCHMARK_NAME}] WARN — max ${summary.maxMs}ms > threshold ${THRESHOLD_MS}ms or non-zero exit (PRD §5.2.3)`);
  }
}

run()
  .catch((err: unknown) => {
    const message = err instanceof Error ? (err.stack ?? err.message) : String(err);
    console.error(message);
    process.exitCode = 1;
  })
  .finally(() => {
    setTimeout(() => process.exit(process.exitCode ?? 0), 50).unref();
  });
