import { create, useStore } from 'zustand';
import { temporal } from 'zundo';
import { buildPrompt, buildPreview } from '../../core/builder/promptBuilder.js';
import { estimateTokens } from '../../core/builder/tokenEstimator.js';
import {
  activateCard,
  deactivateCard,
  reorderCards,
  updateCardValue,
} from '../../core/builder/cardSession.js';
import type { SectionCard, CardSession } from '../../core/types/card.js';
import type { ScanResult } from '../../core/types.js';

interface CardStore {
  treeId: string | null;
  cards: SectionCard[];
  scanResult: ScanResult | null;
  prompt: string;
  preview: string;
  tokenEstimate: number;
  isScanLoading: boolean;

  setSession: (session: CardSession) => void;
  setScanResult: (result: ScanResult) => void;
  updateCardValue: (cardId: string, value: string) => void;
  activateCard: (cardId: string) => void;
  deactivateCard: (cardId: string) => void;
  reorderCards: (orderedActiveIds: string[]) => void;
  setIsScanLoading: (loading: boolean) => void;
  reset: () => void;

  activeCards: () => SectionCard[];
  inactiveCards: () => SectionCard[];
}

function derivePromptState(cards: SectionCard[]) {
  const prompt = buildPrompt(cards);
  const preview = buildPreview(cards);
  const tokenEstimate = estimateTokens(prompt);
  return { prompt, preview, tokenEstimate };
}

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

      activeCards: () =>
        get()
          .cards.filter((c) => c.active)
          .sort((a, b) => a.order - b.order),

      inactiveCards: () => get().cards.filter((c) => !c.active),
    }),
    {
      limit: 10,
      partialize: (state) => ({
        cards: state.cards,
        prompt: state.prompt,
        preview: state.preview,
        tokenEstimate: state.tokenEstimate,
      }),
    }
  )
);

export const useTemporalStore = () => useStore(useCardStore.temporal);
