import { activateCard, applyAnswers, deactivateCard, remapResolvedCards, reorderCards, updateCardValue } from '@core/builder/cardSession.js';
import { buildPreview, buildPrompt } from '@core/builder/promptBuilder.js';
import { estimateTokens } from '@core/builder/tokenEstimator.js';
import type { CardSession, SectionCard } from '@core/types/card.js';
import type { PromptAnswers, ScanResult } from '@core/types.js';
import { temporal } from 'zundo';
import { create, useStore } from 'zustand';

interface CardStore {
  treeId: string | null;
  cards: SectionCard[];
  scanResult: ScanResult | null;
  prompt: string;
  preview: string;
  tokenEstimate: number;
  isScanLoading: boolean;

  setSession: (session: CardSession) => void;
  reresolveCards: (resolved: SectionCard[]) => void;
  setScanResult: (result: ScanResult) => void;
  updateCardValue: (cardId: string, value: string) => void;
  activateCard: (cardId: string) => void;
  deactivateCard: (cardId: string) => void;
  reorderCards: (orderedActiveIds: string[]) => void;
  setIsScanLoading: (loading: boolean) => void;
  reset: () => void;
  restoreAnswers: (answers: PromptAnswers) => void;

  activeCards: () => SectionCard[];
  inactiveCards: () => SectionCard[];
}

function derivePromptState(cards: SectionCard[]) {
  const prompt = buildPrompt(cards);
  const preview = buildPreview(cards);
  const tokenEstimate = estimateTokens(prompt);
  return { prompt, preview, tokenEstimate };
}

/**
 * 후행(trailing) 포함 throttle. zundo의 handleSet(히스토리 기록)에만 적용한다.
 * zundo는 `set(...args)`로 라이브 state를 즉시 갱신한 뒤 별도로 히스토리를 기록하므로,
 * 이 throttle은 히스토리 push 빈도만 낮추고 타이핑 응답성에는 영향을 주지 않는다.
 */
function throttle<A extends unknown[]>(fn: (...args: A) => void, ms: number): { (...args: A): void; cancel: () => void } {
  let lastRun = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: A | null = null;
  const run = (...args: A): void => {
    pending = args;
    const elapsed = Date.now() - lastRun;
    if (elapsed >= ms) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      lastRun = Date.now();
      pending = null;
      fn(...args);
    } else if (timer === null) {
      timer = setTimeout(() => {
        lastRun = Date.now();
        timer = null;
        if (pending) fn(...pending);
      }, ms - elapsed);
    }
  };
  // 보류 중인 trailing push를 취소한다. 세션 전환을 히스토리 경계로 만들 때 leftover push 누수를 막는다.
  const cancel = (): void => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    pending = null;
  };
  return Object.assign(run, { cancel });
}

/**
 * 키 입력 버스트를 하나의 undo 단위로 묶는 히스토리 기록 간격(ms).
 * 모델 테스트는 PROMPTCRAFT_HISTORY_THROTTLE_MS=0으로 설정해 동기·결정적으로 기록한다.
 * 브라우저 번들에는 process가 없으므로 가드 후 기본값(500)으로 폴백한다.
 */
const HISTORY_THROTTLE_MS = Number((typeof process !== 'undefined' ? process.env.PROMPTCRAFT_HISTORY_THROTTLE_MS : undefined) ?? 500);

/** 보류 중인 히스토리 throttle push를 취소하는 핸들(handleSet에서 주입). 세션 전환 시 사용. */
let cancelPendingHistory: (() => void) | null = null;

export const useCardStore = create<CardStore>()(
  temporal(
    (set, get) => ({
      treeId: null,
      cards: [],
      scanResult: null,
      prompt: '',
      preview: '',
      tokenEstimate: 0,
      isScanLoading: false,

      setSession: (session) => {
        const { prompt, preview, tokenEstimate } = derivePromptState(session.cards);
        // 트리(세션) 전환은 사용자 편집이 아니라 새 컨텍스트 적재다. undo 히스토리의 경계로 취급한다 —
        // 그러지 않으면 partialize가 추적하는 cards만 이전 트리 값으로 복원돼(treeId는 추적 대상이 아님)
        // undo가 트리 경계를 넘어 카드를 이전 트리 세트로 되돌린다.
        cancelPendingHistory?.(); // 이전 세션의 보류 중 throttle push 취소
        const temporal = useCardStore.temporal.getState();
        temporal.pause(); // 이 set은 히스토리에 기록하지 않는다
        set({
          treeId: session.treeId,
          cards: session.cards,
          scanResult: session.scanResult,
          prompt,
          preview,
          tokenEstimate,
        });
        temporal.resume();
        temporal.clear(); // 이전 세션의 히스토리 제거
      },

      // 언어 전환: 새 lang으로 해소된 카드(resolved)의 정의 필드를 받아들이되 현재 카드의
      // value/active/order는 보존한다(remapResolvedCards). 사용자 입력 손실 금지가 불변식.
      reresolveCards: (resolved) => {
        const cards = remapResolvedCards(resolved, get().cards);
        set({ cards, ...derivePromptState(cards) });
      },

      setScanResult: (result) => {
        set({ scanResult: result });
      },

      updateCardValue: (cardId, value) => {
        const cards = updateCardValue(get().cards, cardId, value);
        set({ cards, ...derivePromptState(cards) });
      },

      activateCard: (cardId) => {
        const cards = activateCard(get().cards, cardId);
        set({ cards, ...derivePromptState(cards) });
      },

      deactivateCard: (cardId) => {
        const cards = deactivateCard(get().cards, cardId);
        set({ cards, ...derivePromptState(cards) });
      },

      reorderCards: (orderedActiveIds) => {
        const cards = reorderCards(get().cards, orderedActiveIds);
        set({ cards, ...derivePromptState(cards) });
      },

      setIsScanLoading: (loading) => set({ isScanLoading: loading }),

      reset: () =>
        set({
          treeId: null,
          cards: [],
          scanResult: null,
          prompt: '',
          preview: '',
          tokenEstimate: 0,
        }),

      restoreAnswers: (answers) => {
        const cards = applyAnswers(get().cards, answers);
        set({ cards, ...derivePromptState(cards) });
      },

      activeCards: () =>
        get()
          .cards.filter((c) => c.active)
          .sort((a, b) => a.order - b.order),

      inactiveCards: () => get().cards.filter((c) => !c.active),
    }),
    {
      limit: 10,
      // partialize는 4개 필드를 모두 추적한다 — undo가 cards뿐 아니라 파생 필드까지 일관되게 복원해야 하므로
      // cards만으로 줄이면 undo 후 preview/tokenEstimate가 stale해진다.
      partialize: (state) => ({
        cards: state.cards,
        prompt: state.prompt,
        preview: state.preview,
        tokenEstimate: state.tokenEstimate,
      }),
      // 키 입력마다 히스토리를 push하던 것을 throttle로 묶는다(라이브 state 갱신은 throttle 대상 아님).
      // 보류 push 취소 핸들을 노출해 세션 전환(setSession)이 trailing push를 정리할 수 있게 한다.
      handleSet: (handleSet) => {
        const throttled = throttle(handleSet, HISTORY_THROTTLE_MS);
        cancelPendingHistory = throttled.cancel;
        return throttled;
      },
    }
  )
);

export const useTemporalStore = () => useStore(useCardStore.temporal);
