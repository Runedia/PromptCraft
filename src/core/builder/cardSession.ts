import type { CardDefinition, CardSession, SectionCard, SelectOption, TreeConfig } from '../types/card.js';
import type { ScanResult } from '../types.js';

/**
 * 트리 설정과 카드 정의 JSON을 받아 CardSession을 초기화한다.
 * 스캔 결과가 있으면 stack-environment 자동 채움, role 옵션 주입.
 */
export function createCardSession(
  treeConfig: TreeConfig,
  cardDefs: Record<string, CardDefinition>,
  scanResult: ScanResult | null,
  prefill?: Record<string, string>
): CardSession {
  const allCardIds = [...treeConfig.defaultActiveCards, ...treeConfig.cardPool];

  const cards: SectionCard[] = allCardIds.map((id) => {
    const def = cardDefs[id];
    if (!def) {
      throw new Error(`카드 정의를 찾을 수 없습니다: ${id}`);
    }

    const override = treeConfig.cardOverrides?.[id] ?? {};
    const isActive = treeConfig.defaultActiveCards.includes(id);

    let value = prefill?.[id] ?? override.defaultValue ?? def.defaultValue ?? '';

    if (id === 'stack-environment' && scanResult && !value) {
      value = formatScanToStackEnv(scanResult);
    }

    const options: SelectOption[] | undefined = id === 'role' && scanResult ? buildRoleOptions(scanResult) : def.options;

    return {
      id,
      label: def.label,
      required: def.required ?? false,
      active: isActive,
      order: isActive ? treeConfig.defaultActiveCards.indexOf(id) + 1 : 0,
      inputType: def.inputType,
      value,
      template: def.template,
      hint: override.hint ?? def.hint,
      examples: override.examples ?? def.examples,
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
  const baseOptions: SelectOption[] = [
    { value: 'TypeScript 개발자', label: 'TypeScript 개발자' },
    { value: '백엔드 엔지니어', label: '백엔드 엔지니어' },
    { value: '풀스택 개발자', label: '풀스택 개발자' },
    { value: 'DevOps 엔지니어', label: 'DevOps 엔지니어' },
  ];

  // 스캔 결과 기반 동적 옵션 생성
  const scanBased: SelectOption[] = scan.frameworks.slice(0, 3).map((f) => ({
    value: `${f.name} 개발자`,
    label: `${f.name} 개발자`,
  }));

  // 중복 제거
  const seen = new Set(baseOptions.map((o) => o.value));
  const merged = [...baseOptions];
  for (const opt of scanBased) {
    if (!seen.has(opt.value)) {
      merged.push(opt);
      seen.add(opt.value);
    }
  }

  return merged;
}
