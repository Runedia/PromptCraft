import type { CardDefinition, CardSession, SectionCard, SelectOption, TreeConfig } from '../types/card.js';
import type { ScanResult } from '../types.js';
import { applyDomainOverrides, type DomainOverlay, reorderCardPool } from './domain-overlay.js';
import { type RoleMappings, resolveRoleSuggestions } from './role-resolver.js';

/**
 * 트리 설정과 카드 정의 JSON을 받아 CardSession을 초기화한다.
 * 스캔 결과가 있으면 stack-environment 자동 채움, role 옵션 주입.
 */
export function createCardSession(
  treeConfig: TreeConfig,
  cardDefs: Record<string, CardDefinition>,
  scanResult: ScanResult | null,
  prefill?: Record<string, string>,
  roleMappings?: RoleMappings,
  domainOverlay?: DomainOverlay | null
): CardSession {
  // 3계층 카드 정의 병합: base → treeOverrides → domainOverrides
  const mergedDefs = applyDomainOverrides(cardDefs, treeConfig.cardOverrides, domainOverlay ?? null, treeConfig.id);

  // 도메인 관련성 기반 카드풀 재정렬
  const orderedPool = reorderCardPool(treeConfig.cardPool, domainOverlay?.cardRelevance);

  const allCardIds = [...treeConfig.defaultActiveCards, ...orderedPool];

  const cards: SectionCard[] = allCardIds.map((id) => {
    const def = mergedDefs[id] ?? cardDefs[id];
    if (!def) {
      throw new Error(`카드 정의를 찾을 수 없습니다: ${id}`);
    }

    const isActive = treeConfig.defaultActiveCards.includes(id);
    let value = prefill?.[id] ?? def.defaultValue ?? '';

    if (id === 'stack-environment' && scanResult && !value) {
      value = formatScanToStackEnv(scanResult);
    }

    let options: SelectOption[] | undefined = def.options;
    if (id === 'role') {
      if (roleMappings && scanResult) {
        options = resolveRoleSuggestions(scanResult, treeConfig.id, roleMappings, treeConfig.roleSuffix);
      } else if (scanResult) {
        options = buildRoleOptions(scanResult);
      }
      if (scanResult && !value && options?.length) {
        value = options[0].value;
      }
    }

    return {
      id,
      label: def.label,
      required: def.required ?? false,
      active: isActive,
      order: isActive ? treeConfig.defaultActiveCards.indexOf(id) + 1 : 0,
      inputType: def.inputType,
      value,
      template: def.template,
      hint: def.hint,
      examples: def.examples,
      options,
      scanSuggested: def.scanSuggested ?? false,
    };
  });

  return { treeId: treeConfig.id, cards, scanResult, createdAt: new Date() };
}

/** 카드 활성화: 카드 풀 → active 영역 */
export function activateCard(cards: SectionCard[], cardId: string): SectionCard[] {
  const maxOrder = Math.max(...cards.filter((c) => c.active).map((c) => c.order), 0);
  return cards.map((c) => (c.id === cardId ? { ...c, active: true, order: maxOrder + 1 } : c));
}

/** 카드 비활성화: active 영역 → 카드 풀. 필수 카드는 보호. */
export function deactivateCard(cards: SectionCard[], cardId: string): SectionCard[] {
  const card = cards.find((c) => c.id === cardId);
  if (card?.required) return cards;
  return cards.map((c) => (c.id === cardId ? { ...c, active: false, order: 0 } : c));
}

/** 순서 변경: 드래그 앤 드롭 결과 적용 */
export function reorderCards(cards: SectionCard[], orderedActiveIds: string[]): SectionCard[] {
  return cards.map((c) => {
    const newOrder = orderedActiveIds.indexOf(c.id);
    return newOrder !== -1 ? { ...c, order: newOrder + 1 } : c;
  });
}

/** 카드 값 업데이트 */
export function updateCardValue(cards: SectionCard[], cardId: string, value: string): SectionCard[] {
  return cards.map((c) => (c.id === cardId ? { ...c, value } : c));
}

function formatScanToStackEnv(scan: ScanResult): string {
  const parts: string[] = [];
  if (scan.languages.length > 0) {
    parts.push(`언어: ${scan.languages.map((l) => l.name).join(', ')}`);
  }
  if (scan.frameworks.length > 0) {
    parts.push(`프레임워크: ${scan.frameworks.map((f) => f.name).join(', ')}`);
  }
  if (scan.packageManager) {
    parts.push(`패키지 매니저: ${scan.packageManager}`);
  }
  return parts.join('\n');
}

function buildRoleOptions(scan: ScanResult): SelectOption[] {
  const roles: string[] = [];
  const seen = new Set<string>();
  const addRole = (r: string) => {
    if (!seen.has(r)) {
      seen.add(r);
      roles.push(r);
    }
  };

  // 주 언어 기반 역할 우선
  const primaryLang = scan.languages.find((l) => l.role === 'primary');
  if (primaryLang) addRole(`${primaryLang.name} 개발자`);

  // 프레임워크 기반 (상위 2개)
  for (const fw of scan.frameworks.slice(0, 2)) {
    addRole(`${fw.name} 개발자`);
  }

  // general fallback
  for (const r of ['소프트웨어 엔지니어', '풀스택 개발자', '백엔드 엔지니어']) {
    addRole(r);
  }

  return roles.map((r) => ({ value: r, label: r }));
}
