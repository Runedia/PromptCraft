import { defineConfig, devices } from '@playwright/test';

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
    env: {
      PORT: String(PERF_PORT),
    },
  },
});
