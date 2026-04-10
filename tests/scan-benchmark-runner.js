const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const { transformSync } = require('@swc/core');

const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function resolveWithTsFallback(request, parent, isMain, options) {
  try {
    return originalResolveFilename.call(this, request, parent, isMain, options);
  } catch (err) {
    if (typeof request === 'string' && request.endsWith('.js')) {
      return originalResolveFilename.call(this, `${request.slice(0, -3)}.ts`, parent, isMain, options);
    }
    throw err;
  }
};

require.extensions['.ts'] = function compileTs(module, filename) {
  const source = fs.readFileSync(filename, 'utf8');
  const output = transformSync(source, {
    filename,
    jsc: {
      target: 'es2022',
      parser: {
        syntax: 'typescript',
        dynamicImport: true,
      },
    },
    module: {
      type: 'commonjs',
    },
  });
  module._compile(output.code, filename);
};

const { scan } = require('../src/core/scanner/index.ts');
const { createScanPerfFixture, ensureDir, removeDir } = require('./scan-perf-utils');

const DEFAULT_ITERATIONS = 5;
const RESULTS_DIR = path.join(process.cwd(), 'tests', 'perf-results');
const RESULTS_FILE = path.join(RESULTS_DIR, 'scan-benchmark.json');
const FIXTURE_WORK_DIR = path.join(process.cwd(), 'tests', 'tmp');

function parseIntOrDefault(value, fallback) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

function summarize(samples) {
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

function readHistory() {
  if (!fs.existsSync(RESULTS_FILE)) return [];
  try {
    const raw = fs.readFileSync(RESULTS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeHistory(history) {
  ensureDir(RESULTS_DIR);
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(history, null, 2), 'utf8');
}

async function run() {
  const maxDepth = parseIntOrDefault(process.env.SCAN_PERF_MAX_DEPTH, 6);
  const maxBranch = parseIntOrDefault(process.env.SCAN_PERF_MAX_BRANCH, 4);
  const scanDepth = parseIntOrDefault(process.env.SCAN_PERF_SCAN_DEPTH, 100);
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

  const samples = [];
  const phaseSamples = [];
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

run().catch((err) => {
  console.error(err.stack || err.message);
  process.exitCode = 1;
});
