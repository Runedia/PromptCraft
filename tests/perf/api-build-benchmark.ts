import express from 'express';
import request from 'supertest';
import type { CardDefinition, SectionCard } from '../../src/core/types/card.js';
import { cardLoader } from '../../src/server/card-loader.js';
import { errorHandler } from '../../src/server/middleware/errorHandler.js';
import promptRouter from '../../src/server/routes/prompt.js';
import { appendHistory, evaluatePass, formatReport, summarize } from './perf-reporter.js';

const BENCHMARK_NAME = 'api-build';
const THRESHOLD_MS = 5000;
const TARGET_ACTIVE_CARDS = 25;

interface ApiBuildConfig {
  activeCardCount: number;
  totalCardCount: number;
  iterations: number;
  treeId: string;
}

function parseIntOrDefault(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

function pickExampleValue(def: CardDefinition): string {
  if (def.examples && def.examples.length > 0) return def.examples[0];
  if (def.options && def.options.length > 0) return def.options[0].value;
  if (def.defaultValue) return def.defaultValue;
  return `벤치마크 입력 — ${def.label}. 25개 카드 채움 상태 측정용 샘플 값.`;
}

function buildSampleCards(defs: Record<string, CardDefinition>, count: number): { cards: SectionCard[]; totalCards: number } {
  const entries = Object.entries(defs);
  const ordered = [...entries.filter(([_, def]) => def.required === true), ...entries.filter(([_, def]) => def.required !== true)];
  const cards: SectionCard[] = ordered.map(([id, def], idx) => {
    const isActive = idx < count;
    return {
      id,
      label: def.label,
      required: def.required ?? false,
      active: isActive,
      order: isActive ? idx + 1 : 0,
      inputType: def.inputType,
      value: isActive ? pickExampleValue(def) : '',
      template: def.template,
      hint: def.hint,
      examples: def.examples,
      options: def.options,
      scanSuggested: def.scanSuggested ?? false,
    };
  });
  return { cards, totalCards: cards.length };
}

function buildApp() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));
  app.use('/api/prompt', promptRouter);
  app.use(errorHandler);
  return app;
}

async function run(): Promise<void> {
  const iterations = parseIntOrDefault(process.env.PERF_BUILD_ITERATIONS, 10);
  const treeId = process.env.PERF_BUILD_TREE_ID ?? 'general';

  const defs = await cardLoader.loadCardDefinitions();
  const totalAvailable = Object.keys(defs).length;
  const desired = Math.min(TARGET_ACTIVE_CARDS, totalAvailable);
  const { cards, totalCards } = buildSampleCards(defs, desired);

  const config: ApiBuildConfig = {
    activeCardCount: desired,
    totalCardCount: totalCards,
    iterations,
    treeId,
  };

  const app = buildApp();
  const samples: number[] = [];
  const notes: string[] = [];

  for (let i = 0; i < iterations; i += 1) {
    const started = performance.now();
    const res = await request(app).post('/api/prompt/build').send({ cards, treeId, saveToHistory: false });
    const elapsed = performance.now() - started;
    if (res.status !== 200) {
      notes.push(`iter ${i}: HTTP ${res.status} — ${JSON.stringify(res.body).slice(0, 200)}`);
      continue;
    }
    samples.push(elapsed);
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
