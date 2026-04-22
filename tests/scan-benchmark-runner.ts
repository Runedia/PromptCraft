import fs from 'node:fs';
import path from 'node:path';

import { scan } from '../src/core/scanner/index.js';
import type { ScanTimings } from '../src/core/types.js';
import { createScanPerfFixture, ensureDir, removeDir } from './scan-perf-utils.js';

const DEFAULT_ITERATIONS = 5;
const RESULTS_DIR = path.join(process.cwd(), 'tests', 'perf-results');
const RESULTS_FILE = path.join(RESULTS_DIR, 'scan-benchmark.json');
const FIXTURE_WORK_DIR = path.join(process.cwd(), 'tests', 'tmp');

function parseIntOrDefault(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

function summarize(samples: number[]) {
  const sorted = samples.slice().sort((a, b) => a - b);
  const count = sorted.length;
  const min = sorted[0];
  const max = sorted[count - 1];
  const avg = sorted.reduce((sum, v) => sum + v, 0) / count;
  const p95Index = Math.min(count - 1, Math.ceil(count * 0.95) - 1);
  const p95 = sorted[p95Index];
  return {
    count,
    minMs: Math.round(min * 100) / 100,
    maxMs: Math.round(max * 100) / 100,
    avgMs: Math.round(avg * 100) / 100,
    p95Ms: Math.round(p95 * 100) / 100,
  };
}

type BenchmarkEntry = {
  executedAt: string;
  config: {
    maxDepth: number;
    maxBranch: number;
    scanDepth: number;
    fileCount: number;
    iterations: number;
    seed: number;
    extensions: string[];
  };
  summary: ReturnType<typeof summarize>;
  samplesMs: number[];
  phaseSamples: Array<ScanTimings | null>;
};

function readHistory(): BenchmarkEntry[] {
  if (!fs.existsSync(RESULTS_FILE)) return [];
  try {
    const raw = fs.readFileSync(RESULTS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeHistory(history: BenchmarkEntry[]): void {
  ensureDir(RESULTS_DIR);
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(history, null, 2), 'utf8');
}

async function run() {
  const maxDepth = parseIntOrDefault(process.env.SCAN_PERF_MAX_DEPTH, 6);
  const maxBranch = parseIntOrDefault(process.env.SCAN_PERF_MAX_BRANCH, 4);
  const scanDepth = parseIntOrDefault(process.env.SCAN_PERF_DEPTH ?? process.env.SCAN_PERF_SCAN_DEPTH, 100);
  const fileCount = parseIntOrDefault(process.env.SCAN_PERF_FILES, 1000);
  const iterations = parseIntOrDefault(process.env.SCAN_PERF_ITERATIONS, DEFAULT_ITERATIONS);
  const seed = parseIntOrDefault(process.env.SCAN_PERF_SEED, 20260323);

  ensureDir(FIXTURE_WORK_DIR);
  const fixture = createScanPerfFixture({
    maxDepth,
    maxBranch,
    fileCount,
    seed,
    baseRoot: FIXTURE_WORK_DIR,
    datasetName: `scan-perf-${Date.now()}`,
  });

  const samples: number[] = [];
  const phaseSamples: Array<ScanTimings | null> = [];
  try {
    for (let i = 0; i < iterations; i += 1) {
      const start = Date.now();
      const result = await scan(fixture.fixtureRoot, { depth: scanDepth, metrics: true });
      const elapsed = Date.now() - start;
      samples.push(elapsed);
      phaseSamples.push(result.timings || null);
    }
  } finally {
    removeDir(fixture.fixtureRoot);
  }

  const summary = summarize(samples);
  const entry = {
    executedAt: new Date().toISOString(),
    config: {
      maxDepth,
      maxBranch,
      scanDepth,
      fileCount,
      iterations,
      seed,
      extensions: fixture.extensions,
    },
    summary,
    samplesMs: samples,
    phaseSamples,
  };

  const history = readHistory();
  history.push(entry);
  writeHistory(history);

  console.log(JSON.stringify({ summary, resultsFile: RESULTS_FILE }, null, 2));
}

run().catch((err: unknown) => {
  if (err instanceof Error) {
    console.error(err.stack || err.message);
  } else {
    console.error(String(err));
  }
  process.exitCode = 1;
});
