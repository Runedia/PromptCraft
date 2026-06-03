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
function throttle<A extends unknown[]>(fn: (...args: A) => void, ms: number): (...args: A) => void {
  let lastRun = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: A | null = null;
  return (...args: A) => {
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
}

/** 키 입력 버스트를 하나의 undo 단위로 묶는 히스토리 기록 간격(ms). */
const HISTORY_THROTTLE_MS = 500;

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
        set({
          treeId: session.treeId,
          cards: session.cards,
          scanResult: session.scanResult,
          prompt,
          preview,
          tokenEstimate,
        });
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
      handleSet: (handleSet) => throttle(handleSet, HISTORY_THROTTLE_MS),
    }
  )
);

export const useTemporalStore = () => useStore(useCardStore.temporal);
