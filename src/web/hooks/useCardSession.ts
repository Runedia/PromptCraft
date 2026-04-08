import { useCallback, useEffect } from 'react';
import { createCardSession } from '../../core/builder/cardSession.js';
import { useCardStore } from '../store/cardStore.js';
import type { TreeConfig, CardDefinition } from '../../core/types/card.js';
import type { ScanResult } from '../../core/types.js';

const SESSION_KEY_PREFIX = 'promptcraft:session:';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24시간

interface SavedSession {
  treeId: string;
  cards: ReturnType<typeof useCardStore.getState>['cards'];
  savedAt: number;
}

export function useCardSession() {
  const setSession = useCardStore((s) => s.setSession);
  const cards = useCardStore((s) => s.cards);
  const treeId = useCardStore((s) => s.treeId);

  /** localStorage에 세션 자동 저장 (debounce 1초) */
  useEffect(() => {
    if (!treeId || cards.length === 0) return;
    // 사용자가 실제로 값을 입력한 카드가 없으면 저장하지 않음 (기본값 상태 저장 방지)
    const hasUserInput = cards.some((c) => typeof c.value === 'string' && c.value.trim() !== '');
    if (!hasUserInput) return;
    const timer = setTimeout(() => {
      const key = `${SESSION_KEY_PREFIX}${treeId}`;
      const payload: SavedSession = { treeId, cards, savedAt: Date.now() };
      try {
        localStorage.setItem(key, JSON.stringify(payload));
      } catch {
        // localStorage 쓰기 실패 무시
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [treeId, cards]);

  /** 저장된 세션 조회 (24시간 TTL) */
  const getSavedSession = useCallback((id: string): SavedSession | null => {
    try {
      const raw = localStorage.getItem(`${SESSION_KEY_PREFIX}${id}`);
      if (!raw) return null;
      const parsed: SavedSession = JSON.parse(raw);
      if (Date.now() - parsed.savedAt > SESSION_TTL_MS) {
        localStorage.removeItem(`${SESSION_KEY_PREFIX}${id}`);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }, []);

  /** 저장된 세션 삭제 */
  const clearSavedSession = useCallback((id: string) => {
    localStorage.removeItem(`${SESSION_KEY_PREFIX}${id}`);
  }, []);

  /** 새 세션 초기화 */
  const initSession = useCallback(
    (
      treeConfig: TreeConfig,
      cardDefs: Record<string, CardDefinition>,
      scanResult: ScanResult | null,
      prefill?: Record<string, string>
    ) => {
      const session = createCardSession(treeConfig, cardDefs, scanResult, prefill);
      setSession(session);
    },
    [setSession]
  );

  /** 저장된 세션 복원 */
  const restoreSession = useCallback(
    (saved: SavedSession) => {
      setSession({
        treeId: saved.treeId,
        cards: saved.cards,
        scanResult: null,
        createdAt: new Date(saved.savedAt),
      });
    },
    [setSession]
  );

  return { initSession, restoreSession, getSavedSession, clearSavedSession };
}
