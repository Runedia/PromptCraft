// 모델 기반(property-based) store 테스트.
// 무작위 액션 시퀀스(EnterTree/UpdateValue/Undo/Redo)를 대량 생성해, 매 명령 후
// "트리 경계 격리" 불변식을 검증한다. 사람이 A→B→undo 같은 시퀀스를 상상하지 않아도
// fast-check가 그 경로를 밟고, 위반 시 최소 반례까지 자동 축소(shrink)해 보여준다.
//
// throttle은 결정성을 위해 0으로 둔다(아래 env 설정 → store가 dynamic import 시점에 읽음).
// 정적 import는 store를 로드하지 않으므로 env 설정보다 먼저 평가돼도 무방하다.
process.env.PROMPTCRAFT_HISTORY_THROTTLE_MS = '0';

import { test } from 'bun:test';
import fc from 'fast-check';
import type { CardSession, SectionCard } from '../../../src/core/types/card.js';

const { useCardStore } = await import('../../../src/web/store/cardStore.js');

// ── 합성 트리 정의 ──────────────────────────────────────────────
// 각 트리는 자기 카드 id로만 구성된다. 한 트리의 카드 id가 다른 트리에 나타나면 누수다.
const TREES: Record<string, string[]> = {
  'code-review': ['cr-role', 'cr-target', 'cr-focus'],
  'error-solving': ['es-role', 'es-error', 'es-context'],
  refactoring: ['rf-role', 'rf-scope'],
};
const TREE_IDS = Object.keys(TREES);

function buildSession(treeId: string): CardSession {
  const cards: SectionCard[] = TREES[treeId].map((id, i) => ({
    id,
    label: id,
    required: false,
    active: true,
    order: i,
    inputType: 'text',
    value: '',
    template: `{{${id}}}`,
  }));
  return { treeId, cards, scanResult: null, createdAt: new Date(0) };
}

type Model = { treeId: string | null };
type Real = { store: typeof useCardStore; temporal: typeof useCardStore.temporal };

// 핵심 불변식 — 위반 시 throw → fast-check가 실패로 보고하고 반례를 축소한다.
function assertTreeIsolation(real: Real): void {
  const { treeId, cards } = real.store.getState();
  if (treeId === null) return;
  const allowed = new Set(TREES[treeId] ?? []);
  for (const c of cards) {
    if (!allowed.has(c.id)) {
      throw new Error(`트리 경계 누수: treeId='${treeId}'인데 카드 '${c.id}'가 섞임 (허용: ${[...allowed].join(', ')})`);
    }
  }
}

// ── Commands ────────────────────────────────────────────────────
class EnterTree implements fc.Command<Model, Real> {
  constructor(readonly treeId: string) {}
  check(): boolean {
    return true;
  }
  run(m: Model, r: Real): void {
    r.store.getState().setSession(buildSession(this.treeId));
    m.treeId = this.treeId;
    assertTreeIsolation(r);
  }
  toString(): string {
    return `EnterTree(${this.treeId})`;
  }
}

class UpdateValue implements fc.Command<Model, Real> {
  constructor(
    readonly pick: number,
    readonly value: string
  ) {}
  check(m: Model): boolean {
    return m.treeId !== null;
  }
  run(_m: Model, r: Real): void {
    const cards = r.store.getState().cards;
    if (cards.length === 0) return;
    const card = cards[this.pick % cards.length];
    r.store.getState().updateCardValue(card.id, this.value);
    assertTreeIsolation(r);
  }
  toString(): string {
    return `UpdateValue(#${this.pick}="${this.value}")`;
  }
}

class Undo implements fc.Command<Model, Real> {
  check(): boolean {
    return true;
  }
  run(_m: Model, r: Real): void {
    r.temporal.getState().undo();
    assertTreeIsolation(r);
  }
  toString(): string {
    return 'Undo';
  }
}

class Redo implements fc.Command<Model, Real> {
  check(): boolean {
    return true;
  }
  run(_m: Model, r: Real): void {
    r.temporal.getState().redo();
    assertTreeIsolation(r);
  }
  toString(): string {
    return 'Redo';
  }
}

// ── Property ────────────────────────────────────────────────────
const commandsArb = fc.commands(
  [
    fc.constantFrom(...TREE_IDS).map((id) => new EnterTree(id)),
    fc.record({ pick: fc.nat(5), value: fc.string({ maxLength: 8 }) }).map(({ pick, value }) => new UpdateValue(pick, value)),
    fc.constant(new Undo()),
    fc.constant(new Redo()),
  ],
  { maxCommands: 20 }
);

test('무작위 액션 시퀀스에서 트리 경계 격리 불변식이 유지된다', () => {
  fc.assert(
    fc.property(commandsArb, (cmds) => {
      const setup = (): { model: Model; real: Real } => {
        // 각 run마다 store를 빈 상태로 초기화한다(throttle 0이라 동기·trailing 누수 없음).
        const t = useCardStore.temporal.getState();
        t.pause();
        useCardStore.setState({ treeId: null, cards: [], scanResult: null, prompt: '', preview: '', tokenEstimate: 0 });
        t.resume();
        t.clear();
        return { model: { treeId: null }, real: { store: useCardStore, temporal: useCardStore.temporal } };
      };
      fc.modelRun(setup, cmds);
    }),
    { numRuns: 200 }
  );
});
