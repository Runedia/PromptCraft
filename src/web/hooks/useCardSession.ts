import { createCardSession } from '@core/builder/cardSession.js';
import type { DomainOverlay } from '@core/builder/domain-overlay.js';
import type { RoleMappings } from '@core/builder/role-resolver.js';
import type { CardDefinition, TreeConfig } from '@core/types/card.js';
import type { ScanResult } from '@core/types.js';
import type { Locale } from '@shared/i18n/types.js';
import { useCallback, useEffect } from 'react';
import { useLocale } from '@/i18n/LocaleContext.js';
import { useCardStore } from '@/store/cardStore.js';
import type { ResolvedTree } from '@/types/tree.js';

const SESSION_KEY_PREFIX = 'promptcraft:session:';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24시간

interface SavedSession {
  treeId: string;
  projectPath?: string;
  cards: ReturnType<typeof useCardStore.getState>['cards'];
  savedAt: number;
}

/**
 * ResolvedTree → TreeConfig. 유일한 차이는 label/description가 string(해소됨) vs I18nText인데,
 * createCardSession은 이 두 display 필드를 참조하지 않는다(roleSuffix는 I18nText로 일치).
 * 따라서 label/description만 좁혀 단언한다.
 */
function toCoreTree(treeConfig: ResolvedTree): TreeConfig {
  return { ...treeConfig, label: treeConfig.label as unknown, description: treeConfig.description as unknown } as TreeConfig;
}

export function useCardSession() {
  const setSession = useCardStore((s) => s.setSession);
  const reresolveStoreCards = useCardStore((s) => s.reresolveCards);
  const cards = useCardStore((s) => s.cards);
  const treeId = useCardStore((s) => s.treeId);
  const scanResultPath = useCardStore((s) => s.scanResult?.path);
  const { lang } = useLocale();

  /** localStorage에 세션 자동 저장 (debounce 1초) */
  useEffect(() => {
    if (!treeId || cards.length === 0) return;
    // 사용자가 실제로 값을 입력한 카드가 없으면 저장하지 않음 (기본값 상태 저장 방지)
    const hasUserInput = cards.some((c) => typeof c.value === 'string' && c.value.trim() !== '');
    if (!hasUserInput) return;
    const timer = setTimeout(() => {
      const key = `${SESSION_KEY_PREFIX}${treeId}`;
      const payload: SavedSession = { treeId, projectPath: scanResultPath, cards, savedAt: Date.now() };
      try {
        localStorage.setItem(key, JSON.stringify(payload));
      } catch {
        // localStorage 쓰기 실패 무시
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [treeId, cards, scanResultPath]);

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

  /** 새 세션 초기화. ResolvedTree(서버 반환 형태)를 받아 createCardSession에 위임한다. */
  const initSession = useCallback(
    (
      treeConfig: ResolvedTree,
      cardDefs: Record<string, CardDefinition>,
      scanResult: ScanResult | null,
      prefill?: Record<string, string>,
      roleMappings?: RoleMappings | null,
      domainOverlay?: DomainOverlay | null,
      overrideLang?: Locale
    ) => {
      const session = createCardSession(
        toCoreTree(treeConfig),
        cardDefs,
        scanResult,
        prefill,
        roleMappings ?? undefined,
        domainOverlay ?? undefined,
        overrideLang ?? lang
      );
      setSession(session);
    },
    [setSession, lang]
  );

  /**
   * 언어 전환용 카드 재해소. 새 lang으로 정의(label/template/options/hint)를 다시 해소하되,
   * 현재 세션의 사용자 입력(value)·활성/순서 상태는 보존한다(store.reresolveCards → remapResolvedCards).
   * scanResult는 현재 store 값을 사용한다(role 옵션·stack-environment 재해소에 필요).
   */
  const reresolveCardsForLang = useCallback(
    (treeConfig: ResolvedTree, cardDefs: Record<string, CardDefinition>, roleMappings: RoleMappings | null, overrideLang?: Locale) => {
      const scanResult = useCardStore.getState().scanResult;
      // 정의 해소만 필요하므로 prefill은 주지 않는다(value는 remap 단계에서 현재 카드에서 보존).
      const fresh = createCardSession(toCoreTree(treeConfig), cardDefs, scanResult, undefined, roleMappings ?? undefined, undefined, overrideLang ?? lang);
      reresolveStoreCards(fresh.cards);
    },
    [reresolveStoreCards, lang]
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

  return { initSession, reresolveCardsForLang, restoreSession, getSavedSession, clearSavedSession };
}
