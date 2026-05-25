import fs from 'node:fs';
import path from 'node:path';
import type { Page } from '@playwright/test';
import type { CardDefinition, CardSession, SectionCard } from '../../src/core/types/card.js';

export interface SeedSession {
  treeId: string;
  projectPath: string;
  cards: SectionCard[];
  savedAt: number;
}

function pickExampleValue(def: CardDefinition, labelKo: string): string {
  if (def.examples && def.examples.ko.length > 0) return def.examples.ko[0];
  if (def.options && def.options.length > 0) return def.options[0].value.ko;
  if (def.defaultValue) return def.defaultValue.ko;
  return `벤치마크 입력 — ${labelKo}. 25개 카드 활성화 상태 측정용 샘플 텍스트.`;
}

export function loadCardDefinitions(): Record<string, CardDefinition> {
  const file = path.join(process.cwd(), 'data', 'cards', 'card-definitions.json');
  const raw = fs.readFileSync(file, 'utf8');
  return JSON.parse(raw) as Record<string, CardDefinition>;
}

export function buildSeedSession(treeId: string, activeCount: number): SeedSession {
  const defs = loadCardDefinitions();
  const entries = Object.entries(defs);
  const ordered = [...entries.filter(([_, def]) => def.required === true), ...entries.filter(([_, def]) => def.required !== true)];

  const cards: SectionCard[] = ordered.map(([id, def], idx) => {
    const isActive = idx < activeCount;
    const labelKo = def.label.ko;
    return {
      id,
      label: labelKo,
      required: def.required ?? false,
      active: isActive,
      order: isActive ? idx + 1 : 0,
      inputType: def.inputType,
      value: isActive ? pickExampleValue(def, labelKo) : '',
      template: def.template.ko,
      hint: def.hint?.ko,
      examples: def.examples?.ko,
      options: def.options?.map((o) => ({ value: o.value.ko, label: o.label.ko, description: o.description?.ko })),
      scanSuggested: def.scanSuggested ?? false,
    };
  });

  return {
    treeId,
    projectPath: '',
    cards,
    savedAt: Date.now(),
  };
}

/**
 * store 주입 단계. enterWorkspaceWithSession이 /api/trees 응답 도착을 이미 보장한 뒤 호출된다.
 * 1) __promptcraftTest hook 설치 완료 대기 — 동적 import 완료 보장(C-2)
 * 2) setSession으로 fixture 주입(C-1)
 * 3) WORK_SECTION_CARD 렌더 대기로 주입 최종 반영 확정 — initSession이 덮으면 silent pass 없이 실패로 드러남
 *
 * 결정성: response 도착(enterWorkspaceWithSession의 await treesResp) 후 남은 microtask 체인
 * (r.json() + 2개의 .then)은 이어지는 CDP 왕복(waitForFunction/evaluate) 동안의 이벤트 루프
 * checkpoint에서 flush되므로 initSession이 evaluate보다 먼저 완료된다. e2e fixture는 projectPath=''
 * 이라 마운트 시 store 쓰기가 initSession 1회뿐(scan 미발생)이어서 잔존 race window가 비현실적이다.
 */
export async function injectSession(page: Page, session: SeedSession): Promise<void> {
  await page.waitForFunction(() => Boolean((window as Window & { __promptcraftTest?: unknown }).__promptcraftTest), { timeout: 10_000 });
  await page.evaluate((s) => {
    const hook = (window as Window & { __promptcraftTest?: { setSession: (x: CardSession) => void } }).__promptcraftTest;
    if (!hook) throw new Error('__promptcraftTest hook 미노출 — VITE_E2E 빌드인지 확인');
    hook.setSession({ treeId: s.treeId, cards: s.cards, scanResult: null, createdAt: new Date(s.savedAt) });
  }, session);
  await page.locator('[data-ui-id="WORK_SECTION_CARD"]').first().waitFor({ state: 'visible', timeout: 10_000 });
}

/**
 * 워크스페이스에 카드가 채워진 상태로 진입한다.
 * /api/trees fetch 완료(=initSession 트리거 완료)를 기다린 뒤 주입해 race를 닫는다.
 */
export async function enterWorkspaceWithSession(page: Page, session: SeedSession): Promise<void> {
  await page.addInitScript((treeId: string) => {
    history.replaceState({ type: 'workspace', treeId, projectPath: '' }, '', `/workspace/${treeId}`);
  }, session.treeId);
  const treesResp = page.waitForResponse((r) => r.url().includes(`/api/trees/${session.treeId}`), { timeout: 15_000 });
  await page.goto('/');
  await treesResp;
  await injectSession(page, session);
}
