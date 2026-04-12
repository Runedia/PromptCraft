import type { CardDefinition, SelectOption } from '../types/card.js';

export interface DomainCardOverride {
  label?: string;
  hint?: string;
  defaultValue?: string;
  options?: SelectOption[];
  /** tree별 예시 맵 또는 단순 배열 */
  examples?: Record<string, string[]> | string[];
}

export interface DomainOverlay {
  domain: string;
  cardOverrides: Record<string, DomainCardOverride>;
  cardRelevance?: Record<string, 'high' | 'medium' | 'low'>;
}

/** DomainCardOverride를 특정 treeId 기준으로 Partial<CardDefinition>으로 변환 */
function resolveDomainCardOverride(ov: DomainCardOverride, treeId: string): Partial<CardDefinition> {
  const { examples, ...rest } = ov;
  let resolvedExamples: string[] | undefined;
  if (Array.isArray(examples)) {
    resolvedExamples = examples;
  } else if (examples && typeof examples === 'object') {
    resolvedExamples = (examples as Record<string, string[]>)[treeId];
  }
  return {
    ...rest,
    ...(resolvedExamples !== undefined ? { examples: resolvedExamples } : {}),
  };
}

/**
 * 3계층 카드 정의 병합:
 *   cardDefs (base) → treeOverrides (트리별) → domainOverrides (도메인별, 최우선)
 */
export function applyDomainOverrides(
  cardDefs: Record<string, CardDefinition>,
  treeOverrides: Record<string, Partial<CardDefinition>> | undefined,
  domainOverlay: DomainOverlay | null,
  treeId: string
): Record<string, CardDefinition> {
  const result: Record<string, CardDefinition> = {};
  for (const [cardId, def] of Object.entries(cardDefs)) {
    const treeOv = treeOverrides?.[cardId] ?? {};
    const domainOvRaw = domainOverlay?.cardOverrides?.[cardId];
    if (!domainOvRaw) {
      result[cardId] = { ...def, ...treeOv } as CardDefinition;
    } else {
      const domainOv = resolveDomainCardOverride(domainOvRaw, treeId);
      result[cardId] = { ...def, ...treeOv, ...domainOv } as CardDefinition;
    }
  }
  return result;
}

/**
 * 카드풀을 도메인 관련성 점수에 따라 재정렬한다.
 * high → medium → low 순서. relevance 없는 카드는 medium으로 간주.
 */
export function reorderCardPool(cardPool: string[], relevance: Record<string, 'high' | 'medium' | 'low'> | undefined): string[] {
  if (!relevance) return cardPool;
  const order: Record<'high' | 'medium' | 'low', number> = { high: 0, medium: 1, low: 2 };
  return [...cardPool].sort((a, b) => {
    const ra = order[relevance[a] ?? 'medium'];
    const rb = order[relevance[b] ?? 'medium'];
    return ra - rb;
  });
}
