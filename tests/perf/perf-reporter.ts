import fs from 'node:fs';
import path from 'node:path';

export const PERF_RESULTS_DIR = path.join(process.cwd(), 'tests', 'perf-results');

export interface PerfSummary {
  count: number;
  minMs: number;
  maxMs: number;
  avgMs: number;
  medianMs: number;
  p95Ms: number;
}

export interface PerfEntry<TConfig = Record<string, unknown>> {
  executedAt: string;
  benchmark: string;
  thresholdMs: number;
  pass: boolean;
  config: TConfig;
  summary: PerfSummary;
  samplesMs: number[];
  notes?: string[];
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export function summarize(samples: number[]): PerfSummary {
  if (samples.length === 0) {
    return { count: 0, minMs: 0, maxMs: 0, avgMs: 0, medianMs: 0, p95Ms: 0 };
  }
  const sorted = samples.slice().sort((a, b) => a - b);
  const count = sorted.length;
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const mid = Math.floor(count / 2);
  const median = count % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  const p95Index = Math.min(count - 1, Math.ceil(count * 0.95) - 1);
  return {
    count,
    minMs: round(sorted[0]),
    maxMs: round(sorted[count - 1]),
    avgMs: round(sum / count),
    medianMs: round(median),
    p95Ms: round(sorted[p95Index]),
  };
}

export function ensureDir(targetPath: string): void {
  fs.mkdirSync(targetPath, { recursive: true });
}

export function appendHistory<TConfig>(filename: string, entry: PerfEntry<TConfig>): string {
  ensureDir(PERF_RESULTS_DIR);
  const target = path.join(PERF_RESULTS_DIR, filename);
  let history: PerfEntry<TConfig>[] = [];
  if (fs.existsSync(target)) {
    try {
      const raw = fs.readFileSync(target, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) history = parsed as PerfEntry<TConfig>[];
    } catch {
      history = [];
    }
  }
  history.push(entry);
  fs.writeFileSync(target, `${JSON.stringify(history, null, 2)}\n`, 'utf8');
  return target;
}

export function formatReport<TConfig>(entry: PerfEntry<TConfig>, resultsFile: string): string {
  const verdict = entry.pass ? 'PASS' : 'WARN';
  const lines = [
    `[${entry.benchmark}] ${verdict} (threshold ${entry.thresholdMs}ms)`,
    `  count=${entry.summary.count}`,
    `  min=${entry.summary.minMs}ms  median=${entry.summary.medianMs}ms  avg=${entry.summary.avgMs}ms  p95=${entry.summary.p95Ms}ms  max=${entry.summary.maxMs}ms`,
    `  results=${resultsFile}`,
  ];
  if (entry.notes && entry.notes.length > 0) {
    for (const note of entry.notes) lines.push(`  note: ${note}`);
  }
  return lines.join('\n');
}

export function evaluatePass(metric: number, thresholdMs: number): boolean {
  return metric <= thresholdMs;
}
