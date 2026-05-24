import { defineConfig, devices } from '@playwright/test';
import os from 'node:os';
import path from 'node:path';

const PERF_PORT = Number(process.env.PERF_E2E_PORT ?? 4173);

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  outputDir: 'tests/perf-results/playwright-artifacts',
  use: {
    baseURL: `http://127.0.0.1:${PERF_PORT}`,
    headless: true,
    viewport: { width: 1440, height: 900 },
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'bun run build:web && bun src/server/index.ts',
    url: `http://127.0.0.1:${PERF_PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: 'ignore',
    stderr: 'pipe',
    // 주의: 이 env는 Playwright가 직접 spawn한 서버에만 적용된다. reuseExistingServer가
    // 외부에서 띄운 4173 서버를 재활용하면 PROMPTCRAFT_DB_PATH가 주입되지 않아 프로덕션 DB를
    // 쓰게 된다 — E2E 실행 시 4173 포트를 Playwright가 직접 기동하도록 비워둘 것.
    env: {
      PORT: String(PERF_PORT),
      PROMPTCRAFT_DB_PATH: path.join(os.tmpdir(), `promptcraft-e2e-${Date.now()}.db`),
    },
  },
});
