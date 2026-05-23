import { expect, test } from '@playwright/test';
import { appendHistory, evaluatePass, formatReport, summarize } from '../perf/perf-reporter.js';
import { buildSeedSession } from './seed-session.js';

const BENCHMARK_NAME = 'preview-latency';
const THRESHOLD_MS = 100;
const ITERATIONS = Number(process.env.PERF_PREVIEW_ITERATIONS ?? 30);
const ACTIVE_CARD_COUNT = 25;
const TREE_ID = 'feature-impl';

interface MeasurementResult {
  samplesMs: number[];
  cardId: string;
  activeCount: number;
  userAgent: string;
}

test.describe.configure({ mode: 'serial' });

test('카드 입력 → 프리뷰 갱신 (PRD §5.2.3 반응속도 < 100ms 중앙값)', async ({ page }) => {
  const session = buildSeedSession(TREE_ID, ACTIVE_CARD_COUNT);
  const sessionKey = `promptcraft:session:${TREE_ID}`;

  await page.addInitScript(
    (args: { session: unknown; key: string; treeId: string }) => {
      localStorage.setItem(args.key, JSON.stringify(args.session));
      history.replaceState({ type: 'workspace', treeId: args.treeId, projectPath: '' }, '', `/workspace/${args.treeId}`);
    },
    { session, key: sessionKey, treeId: TREE_ID }
  );

  await page.goto('/');

  const restore = page.locator('[data-ui-id="WORK_RESTORE_DIALOG"]');
  await restore.waitFor({ state: 'visible', timeout: 15_000 });
  await page.getByRole('button', { name: '이어서 하기' }).click();
  await restore.waitFor({ state: 'hidden', timeout: 10_000 });

  const activeCards = page.locator('[data-ui-id="WORK_SECTION_CARD"]');
  await expect(activeCards).toHaveCount(ACTIVE_CARD_COUNT, { timeout: 15_000 });
  await expect(page.locator('[data-ui-id="WORK_PREVIEW_CONTENT"]')).toBeVisible();

  const result = await page.evaluate(async (iterations: number): Promise<MeasurementResult> => {
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    const allCardEls = Array.from(document.querySelectorAll<HTMLElement>('[data-ui-card-id]'));
    const cardIds = allCardEls.map((el) => el.getAttribute('data-ui-card-id') ?? '');
    const targetCard = allCardEls.find((el) => {
      const id = el.getAttribute('data-ui-card-id');
      if (id !== 'goal' && id !== 'concept' && id !== 'tech-preference') return false;
      return Boolean(el.querySelector<HTMLInputElement>('input:not([type="hidden"])'));
    });
    if (!targetCard) {
      throw new Error(`text input 카드(goal/concept/tech-preference)를 찾을 수 없습니다. 활성 cardIds=${cardIds.join(',')}`);
    }
    const cardId = targetCard.getAttribute('data-ui-card-id') ?? 'unknown';
    const inputEl = targetCard.querySelector<HTMLInputElement>('input:not([type="hidden"])');
    if (!inputEl) throw new Error(`${cardId} 카드의 input을 찾을 수 없습니다.`);

    const preview = document.querySelector<HTMLElement>('[data-ui-id="WORK_PREVIEW_CONTENT"]');
    if (!preview) throw new Error('Preview content 영역을 찾을 수 없습니다.');

    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    if (!setter) throw new Error('HTMLInputElement value setter를 얻을 수 없습니다.');

    const samples: number[] = [];
    const base = inputEl.value;

    for (let i = 0; i < iterations; i += 1) {
      const next = `${base} measurement-${i}`;
      let start = 0;
      const elapsed = await new Promise<number>((resolve, reject) => {
        const timeoutId = window.setTimeout(() => {
          observer.disconnect();
          reject(new Error(`iteration ${i}: 1초 내 preview 갱신 미감지`));
        }, 1000);
        const observer = new MutationObserver(() => {
          const t = performance.now();
          observer.disconnect();
          window.clearTimeout(timeoutId);
          resolve(t - start);
        });
        observer.observe(preview, { childList: true, subtree: true, characterData: true });
        start = performance.now();
        setter.call(inputEl, next);
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
      });
      samples.push(elapsed);
      await sleep(50);
    }

    return {
      samplesMs: samples,
      cardId,
      activeCount: document.querySelectorAll('[data-ui-id="WORK_SECTION_CARD"]').length,
      userAgent: navigator.userAgent,
    };
  }, ITERATIONS);

  const summary = summarize(result.samplesMs);
  const pass = evaluatePass(summary.medianMs, THRESHOLD_MS);
  const entry = {
    executedAt: new Date().toISOString(),
    benchmark: BENCHMARK_NAME,
    thresholdMs: THRESHOLD_MS,
    pass,
    config: {
      iterations: ITERATIONS,
      activeCards: result.activeCount,
      treeId: TREE_ID,
      cardId: result.cardId,
      userAgent: result.userAgent,
    },
    summary,
    samplesMs: result.samplesMs.map((v) => Math.round(v * 100) / 100),
  };

  const resultsFile = appendHistory(`${BENCHMARK_NAME}.json`, entry);
  console.log(`\n${formatReport(entry, resultsFile)}`);
  if (!pass) {
    console.warn(`[${BENCHMARK_NAME}] WARN — median ${summary.medianMs}ms > threshold ${THRESHOLD_MS}ms (PRD §5.2.3)`);
  }

  expect(result.activeCount).toBe(ACTIVE_CARD_COUNT);
  expect(result.samplesMs.length).toBeGreaterThan(0);
});
