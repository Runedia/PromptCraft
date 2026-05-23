import path from 'node:path';
import express from 'express';
import request from 'supertest';
import { errorHandler } from '../../src/server/middleware/errorHandler.js';
import scanRouter from '../../src/server/routes/scan.js';
import { createScanPerfFixture, ensureDir, removeDir } from '../scan-perf-utils.js';
import { appendHistory, evaluatePass, formatReport, summarize } from './perf-reporter.js';

const BENCHMARK_NAME = 'api-scan';
const THRESHOLD_MS = 5000;
const FIXTURE_WORK_DIR = path.join(process.cwd(), 'tests', 'tmp', 'api-scan-fixtures');

interface ApiScanConfig {
  fileCount: number;
  iterations: number;
  seed: number;
  maxDepth: number;
  maxBranch: number;
  coldStart: boolean;
}

function parseIntOrDefault(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

function buildApp() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));
  app.use('/api/scan', scanRouter);
  app.use(errorHandler);
  return app;
}

async function run(): Promise<void> {
  const config: ApiScanConfig = {
    fileCount: parseIntOrDefault(process.env.PERF_SCAN_FILES, 250),
    iterations: parseIntOrDefault(process.env.PERF_SCAN_ITERATIONS, 5),
    seed: parseIntOrDefault(process.env.PERF_SCAN_SEED, 20260523),
    maxDepth: parseIntOrDefault(process.env.PERF_SCAN_MAX_DEPTH, 6),
    maxBranch: parseIntOrDefault(process.env.PERF_SCAN_MAX_BRANCH, 4),
    coldStart: true,
  };

  ensureDir(FIXTURE_WORK_DIR);
  const samples: number[] = [];
  const notes: string[] = [];

  for (let i = 0; i < config.iterations; i += 1) {
    const fixture = createScanPerfFixture({
      maxDepth: config.maxDepth,
      maxBranch: config.maxBranch,
      fileCount: config.fileCount,
      seed: config.seed + i,
      baseRoot: FIXTURE_WORK_DIR,
      datasetName: `iter-${i}-${Date.now()}`,
    });

    const app = buildApp();
    try {
      const started = performance.now();
      const res = await request(app).post('/api/scan').send({ path: fixture.fixtureRoot });
      const elapsed = performance.now() - started;
      if (res.status !== 200) {
        notes.push(`iter ${i}: HTTP ${res.status} — ${JSON.stringify(res.body).slice(0, 200)}`);
        continue;
      }
      samples.push(elapsed);
    } finally {
      removeDir(fixture.fixtureRoot);
    }
  }

  const summary = summarize(samples);
  const pass = evaluatePass(summary.medianMs, THRESHOLD_MS);
  const entry = {
    executedAt: new Date().toISOString(),
    benchmark: BENCHMARK_NAME,
    thresholdMs: THRESHOLD_MS,
    pass,
    config,
    summary,
    samplesMs: samples.map((v) => Math.round(v * 100) / 100),
    notes: notes.length > 0 ? notes : undefined,
  };

  const resultsFile = appendHistory(`${BENCHMARK_NAME}.json`, entry);
  console.log(formatReport(entry, resultsFile));
  if (!pass) {
    console.warn(`[${BENCHMARK_NAME}] WARN — median ${summary.medianMs}ms > threshold ${THRESHOLD_MS}ms (PRD §5.2.3)`);
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
