import { pickArray, pickText } from '../../shared/i18n/pickLang.js';
import { t } from '../../shared/i18n/t.js';
import type { Locale } from '../../shared/i18n/types.js';
import type { CardDefinition, CardSession, SectionCard, SelectOption, SelectOptionDef, TreeConfig } from '../types/card.js';
import type { PromptAnswers, ScanResult, TsCompilerConstraints } from '../types.js';
import { applyDomainOverrides, type DomainOverlay, reorderCardPool } from './domain-overlay.js';
import { type RoleMappings, resolveRoleSuggestions } from './role-resolver.js';

/**
 * SelectOptionDef(i18n value/label/description) 또는 이미 해소된 SelectOption(string)을
 * lang에 맞게 SelectOption[]으로 변환한다. value도 해소하므로 select-or-text 옵션 선택값이
 * en에서 영어로 출력된다. role 동적 옵션은 이미 string이라 그대로 통과한다.
 */
function resolveOptions(opts: SelectOption[] | SelectOptionDef[] | undefined, lang: Locale): SelectOption[] | undefined {
  if (!opts) return undefined;
  return opts.map((o) => {
    if (!o.label) throw new Error(`select option missing label: ${typeof o.value === 'string' ? o.value : JSON.stringify(o.value)}`);
    const value = typeof o.value === 'string' ? o.value : pickText(o.value, lang);
    const label = typeof o.label === 'string' ? o.label : pickText(o.label, lang);
    const description = o.description === undefined ? undefined : typeof o.description === 'string' ? o.description : pickText(o.description, lang);
    return { value, label, description };
  });
}

/**
 * 트리 설정과 카드 정의 JSON을 받아 CardSession을 초기화한다.
 * 스캔 결과가 있으면 stack-environment 자동 채움, role 옵션 주입.
 * lang 기본값 'ko' — 기존 호출자를 깨지 않는다. 서버는 Stage 4에서 lang을 주입한다.
 */
export function createCardSession(
  treeConfig: TreeConfig,
  cardDefs: Record<string, CardDefinition>,
  scanResult: ScanResult | null,
  prefill?: Record<string, string>,
  roleMappings?: RoleMappings,
  domainOverlay?: DomainOverlay | null,
  lang: Locale = 'ko'
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
    // prefill(사용자/히스토리 string) 우선, 없으면 defaultValue(I18nText)를 lang으로 해소
    let value = prefill?.[id] ?? (def.defaultValue ? pickText(def.defaultValue, lang) : '');

    if (id === 'stack-environment' && scanResult && !value) {
      value = formatScanToStackEnv(scanResult, lang);
    }

    // role 분기는 resolveRoleSuggestions가 이미 해소된 SelectOption[]을 반환, 그 외는 디스크 SelectOptionDef[]. resolveOptions가 두 형태를 모두 처리한다.
    let options: SelectOption[] | SelectOptionDef[] | undefined = def.options;
    if (id === 'role') {
      if (roleMappings && scanResult) {
        const roleSuffix = treeConfig.roleSuffix ? pickText(treeConfig.roleSuffix, lang) : undefined;
        options = resolveRoleSuggestions(scanResult, treeConfig.id, roleMappings, roleSuffix, lang);
      } else if (scanResult) {
        options = buildRoleOptions(scanResult, lang);
      }
    }

    // options를 먼저 lang으로 해소한 뒤, 해소된 string value로 기본값을 잡는다.
    // (해소 전 options[0].value는 SelectOptionDef의 I18nText이므로 value 기본값에 직접 쓸 수 없음)
    const resolvedOptions = resolveOptions(options, lang);
    if (id === 'role' && scanResult && !value && resolvedOptions?.length) {
      value = resolvedOptions[0].value;
    }

    return {
      id,
      label: pickText(def.label, lang),
      required: def.required ?? false,
      active: isActive,
      order: isActive ? treeConfig.defaultActiveCards.indexOf(id) + 1 : 0,
      inputType: def.inputType,
      value,
      template: pickText(def.template, lang),
      hint: def.hint ? pickText(def.hint, lang) : undefined,
      examples: def.examples ? pickArray(def.examples, lang) : undefined,
      options: resolvedOptions,
      scanSuggested: def.scanSuggested ?? false,
    };
  });

  return { treeId: treeConfig.id, cards, scanResult, createdAt: new Date() };
}

/**
 * 언어 전환용: 새 lang으로 해소된 정의(label/template/options/hint/examples)는 받아들이되
 * 사용자 런타임 상태(value/active/order)는 현재 세션에서 보존한다.
 *
 * resolved: createCardSession(..., 새 lang)으로 갓 해소한 카드(정의 필드가 새 언어).
 * current: 현재 화면의 카드(사용자 입력 value·활성/순서 상태 보유).
 *
 * 매칭은 카드 id 기준. resolved에만 있는 카드(카드풀 신규)는 그대로 두고, current에만 있는
 * 카드는 무시한다(정의가 없으면 표시 불가). value 손실 방지가 핵심 불변식이다.
 */
export function remapResolvedCards(resolved: SectionCard[], current: SectionCard[]): SectionCard[] {
  const byId = new Map(current.map((c) => [c.id, c]));
  return resolved.map((r) => {
    const cur = byId.get(r.id);
    if (!cur) return r;
    // 정의 해소분(label/template/options/hint/examples/required/inputType/scanSuggested)은 r에서,
    // 런타임 상태(value/active/order)는 cur에서 가져온다.
    return { ...r, value: cur.value, active: cur.active, order: cur.order };
  });
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

function formatScanToStackEnv(scan: ScanResult, lang: Locale): string {
  const parts: string[] = [];
  if (scan.languages.length > 0) {
    parts.push(`${t('core.stackEnv.languages', lang)}: ${scan.languages.map((l) => l.name).join(', ')}`);
  }
  if (scan.frameworks.length > 0) {
    parts.push(`${t('core.stackEnv.frameworks', lang)}: ${scan.frameworks.map((f) => f.name).join(', ')}`);
  }
  if (scan.packageManager) {
    parts.push(`${t('core.stackEnv.packageManager', lang)}: ${scan.packageManager}`);
  }
  if (scan.tsCompilerConstraints) {
    const line = formatTsConstraints(scan.tsCompilerConstraints, lang);
    if (line) parts.push(`${t('core.stackEnv.constraints', lang)}: ${line}`);
  }
  return parts.join('\n');
}

const ESM_MODULE_RE = /^(es|node16|nodenext|preserve)/i;

/** tsconfig 컴파일러 제약을 자연어 행동 지침 한 줄로 정규화한다(조각 0개면 빈 문자열). */
export function formatTsConstraints(c: TsCompilerConstraints, lang: Locale = 'ko'): string {
  const parts: string[] = [];
  if (c.strict) {
    parts.push(t('core.constraints.strict', lang));
  } else {
    if (c.strictNullChecks) parts.push(t('core.constraints.strictNullChecks', lang));
    if (c.noImplicitAny) parts.push(t('core.constraints.noImplicitAny', lang));
  }
  if (c.noUncheckedIndexedAccess) parts.push(t('core.constraints.noUncheckedIndexedAccess', lang));
  if (c.module) {
    if (/commonjs/i.test(c.module)) parts.push(t('core.constraints.commonjs', lang));
    else if (ESM_MODULE_RE.test(c.module)) parts.push(t('core.constraints.esm', lang));
  }
  if (c.verbatimModuleSyntax) parts.push(t('core.constraints.verbatim', lang));
  if (c.target) parts.push(t('core.constraints.target', lang, { target: c.target }));
  if (c.jsx) parts.push(t('core.constraints.jsx', lang));
  return parts.join('; ');
}

function buildRoleOptions(scan: ScanResult, lang: Locale): SelectOption[] {
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
  if (primaryLang) addRole(t('core.role.developerSuffix', lang, { name: primaryLang.name }));

  // 프레임워크 기반 (상위 2개)
  for (const fw of scan.frameworks.slice(0, 2)) {
    addRole(t('core.role.developerSuffix', lang, { name: fw.name }));
  }

  // general fallback
  addRole(t('core.role.softwareEngineer', lang));
  addRole(t('core.role.fullstack', lang));
  addRole(t('core.role.backend', lang));

  return roles.map((r) => ({ value: r, label: r }));
}

/**
 * 히스토리 answers(카드 id→값)를 현재 카드 배열에 적용한다.
 * 비공백 값 카드는 answers 키 순서대로 활성화·order 부여, 빈 값 카드는 비활성화(required 보호).
 * buildPrompt(active·비공백 filter + order sort)가 저장 시점 프롬프트를 재현하도록 한다.
 * 새 배열을 반환하므로 zundo temporal에서 undo 가능하다.
 */
export function applyAnswers(cards: SectionCard[], answers: PromptAnswers): SectionCard[] {
  let nextOrder = 1;
  const orderMap = new Map<string, number>();
  // answers 키 순서 = 저장 시점 활성화 순서. JSON.stringify/parse가 삽입 순서를 보존하므로 복원 순서가 일치한다.
  for (const id of Object.keys(answers)) {
    if ((answers[id] ?? '').trim() !== '') orderMap.set(id, nextOrder++);
  }
  return cards.map((c) => {
    const value = Object.hasOwn(answers, c.id) ? answers[c.id] : c.value;
    if ((value ?? '').trim() !== '') {
      return { ...c, value, active: true, order: orderMap.get(c.id) ?? c.order };
    }
    if (c.required) return { ...c, value, active: true, order: nextOrder++ };
    return { ...c, value, active: false, order: 0 };
  });
}
