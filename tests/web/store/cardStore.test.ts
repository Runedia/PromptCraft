import { beforeEach, describe, expect, test } from 'bun:test';
import type { CardSession, SectionCard } from '../../../src/core/types/card.js';
import { useCardStore } from '../../../src/web/store/cardStore.js';

function card(id: string, value = ''): SectionCard {
  return { id, label: id, required: false, active: true, order: 0, inputType: 'text', value, template: `{{${id}}}` };
}

function session(treeId: string, cards: SectionCard[]): CardSession {
  return { treeId, cards, scanResult: null, createdAt: new Date(0) };
}

// 키 입력 버스트를 묶는 히스토리 throttle(500ms) 창을 확실히 통과시키기 위한 대기.
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const THROTTLE = 600;

describe('cardStore undo 히스토리 — 트리(세션) 경계', () => {
  beforeEach(() => {
    useCardStore.temporal.getState().clear();
    useCardStore.getState().reset();
    useCardStore.temporal.getState().clear();
  });

  test('트리 전환 후 undo는 이전 트리의 카드를 복원하지 않는다', async () => {
    const store = useCardStore;
    const temporal = store.temporal;

    // 트리 A(코드 리뷰) 적재
    store.getState().setSession(session('code-review', [card('cr-card')]));
    await wait(THROTTLE);

    // 트리 B(에러 해결)로 전환
    store.getState().setSession(session('error-solving', [card('es-card')]));
    await wait(THROTTLE);

    // 사용자가 실행 취소
    temporal.getState().undo();

    // 카드가 코드 리뷰(이전 트리)로 돌아가면 안 된다
    const ids = store.getState().cards.map((c) => c.id);
    expect(ids).not.toContain('cr-card');
  });

  test('세션 내 카드 값 편집은 undo로 되돌릴 수 있다', async () => {
    const store = useCardStore;
    const temporal = store.temporal;

    store.getState().setSession(session('code-review', [card('cr-card', '')]));
    await wait(THROTTLE);
    store.getState().updateCardValue('cr-card', 'first');
    await wait(THROTTLE);
    store.getState().updateCardValue('cr-card', 'second');
    await wait(THROTTLE);

    temporal.getState().undo();

    expect(store.getState().cards.find((c) => c.id === 'cr-card')?.value).toBe('first');
  });
});
