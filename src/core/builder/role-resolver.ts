import { pickText } from '../../shared/i18n/pickLang.js';
import type { I18nText, Locale } from '../../shared/i18n/types.js';
import type { SelectOption } from '../types/card.js';
import type { ProgrammingDomain } from '../types/domain.js';
import type { ScanResult } from '../types.js';

export interface RoleMappings {
  domainRoles: Record<string, Record<string, I18nText[]>>;
  frameworkRoles: Record<string, I18nText>;
  languageRoles?: Record<string, I18nText>;
}

/** lang으로 평탄화된 string 버전 RoleMappings (내부 로직 전용) */
interface ResolvedRoleMappings {
  domainRoles: Record<string, Record<string, string[]>>;
  frameworkRoles: Record<string, string>;
  languageRoles?: Record<string, string>;
}

/**
 * (roleMappings, lang) 조합별 평탄화 결과 캐시.
 * roleMappings는 domain-loader가 모듈 수명 동안 캐싱한 단일 인스턴스이므로 WeakMap 키로 적합하다.
 * scan 1회당 resolveRoleSuggestions가 6회(default + 트리 수) 호출되며 동일 (roleMappings, lang)을 반복 평탄화하던 비용을 1회로 줄인다.
 */
const _flattenCache = new WeakMap<RoleMappings, Map<Locale, ResolvedRoleMappings>>();

/** RoleMappings(I18nText)를 lang으로 평탄화한다. (roleMappings, lang)별로 메모이즈된다. */
function flattenRoleMappings(roleMappings: RoleMappings, lang: Locale): ResolvedRoleMappings {
  let byLang = _flattenCache.get(roleMappings);
  if (byLang) {
    const hit = byLang.get(lang);
    if (hit) return hit;
  } else {
    byLang = new Map();
    _flattenCache.set(roleMappings, byLang);
  }
  const resolved = computeFlattenRoleMappings(roleMappings, lang);
  byLang.set(lang, resolved);
  return resolved;
}

/** flattenRoleMappings의 순수 계산부 (캐시 미스 시 호출). */
function computeFlattenRoleMappings(roleMappings: RoleMappings, lang: Locale): ResolvedRoleMappings {
  const domainRoles: Record<string, Record<string, string[]>> = {};
  for (const [domain, treeMap] of Object.entries(roleMappings.domainRoles)) {
    const resolvedTreeMap: Record<string, string[]> = {};
    for (const [treeId, roles] of Object.entries(treeMap)) {
      resolvedTreeMap[treeId] = roles.map((r) => pickText(r, lang));
    }
    domainRoles[domain] = resolvedTreeMap;
  }

  const frameworkRoles: Record<string, string> = {};
  for (const [fw, role] of Object.entries(roleMappings.frameworkRoles)) {
    frameworkRoles[fw] = pickText(role, lang);
  }

  let languageRoles: Record<string, string> | undefined;
  if (roleMappings.languageRoles) {
    languageRoles = {};
    for (const [langName, role] of Object.entries(roleMappings.languageRoles)) {
      languageRoles[langName] = pickText(role, lang);
    }
  }

  return { domainRoles, frameworkRoles, languageRoles };
}

/**
 * 스캔 결과와 트리 유형에 따라 적응형 role 옵션 목록을 반환한다.
 *
 * 진입부에서 roleMappings(I18nText)를 lang으로 평탄화한 뒤 기존 로직을 그대로 적용한다.
 * roleSuffix는 호출자가 이미 lang으로 해소한 string을 넘긴다. 반환은 SelectOption[](string).
 *
 * 출력 순서 (5 슬롯 권장 분배):
 * 1. 트리×조합 역할 — `${Framework} ${roleSuffix}`, `${Language} ${roleSuffix}`, `${roleSuffix}` 자체
 * 2~3. base 역할 — `domainRoles[X].default` 상위 2개 (모든 트리에서 동일하게 노출되어 통일성 보장)
 * 4. 프레임워크 정제 역할 — `frameworkRoles[fw.name]` 1개
 * 5. tree-spec 역할 — `domainRoles[X][treeId]` 상위 1~2개 (트리별 차별화)
 *
 * slice는 호출자가 결정 (server는 5개, workspace role 카드는 전체).
 */
export function resolveRoleSuggestions(
  scanResult: ScanResult | null,
  treeId: string,
  roleMappings: RoleMappings,
  roleSuffix?: string,
  lang: Locale = 'ko'
): SelectOption[] {
  const resolved = flattenRoleMappings(roleMappings, lang);
  const domain = (scanResult?.domainContext?.primary ?? 'general') as ProgrammingDomain;
  const domainMap = resolved.domainRoles[domain] ?? resolved.domainRoles.general ?? {};

  const roleNames: string[] = [];
  const seen = new Set<string>();

  const addRole = (name: string): void => {
    if (!seen.has(name)) {
      seen.add(name);
      roleNames.push(name);
    }
  };

  // 1. 트리×조합 역할 (roleSuffix가 있을 때 최우선)
  if (roleSuffix && scanResult) {
    const primaryFw = scanResult.frameworks?.[0];
    if (primaryFw) addRole(`${primaryFw.name} ${roleSuffix}`);
    const primaryLang = scanResult.languages?.find((l) => l.role === 'primary');
    if (primaryLang) addRole(`${primaryLang.name} ${roleSuffix}`);
    addRole(roleSuffix);
  }

  // 2. base 역할 — 도메인 default 상위 2개 (모든 트리 공통)
  const defaultRoles = domainMap.default ?? [];
  for (const r of defaultRoles.slice(0, 2)) addRole(r);

  // 3. 프레임워크 정제 역할 (상위 1개)
  if (scanResult?.frameworks) {
    for (const fw of scanResult.frameworks) {
      const refined = resolved.frameworkRoles[fw.name];
      if (refined) {
        addRole(refined);
        break;
      }
    }
  }

  // 4. tree-spec 역할 — domainMap[treeId]
  const treeRoles = domainMap[treeId] ?? [];
  for (const r of treeRoles) addRole(r);

  // 5. 도메인 default 잔여 (3번 슬롯 채우기)
  for (const r of defaultRoles) addRole(r);

  // 6. 언어 기반 역할 — framework도 tree-spec도 없는 케이스에서만 보조 (confidence=low 또는 general 도메인)
  const isLowConfidence = scanResult?.domainContext?.confidence === 'low' || domain === 'general';
  if (isLowConfidence && resolved.languageRoles && scanResult?.languages) {
    const primaryLang = scanResult.languages.find((l) => l.role === 'primary');
    if (primaryLang) {
      const langRole = resolved.languageRoles[primaryLang.name];
      if (langRole) addRole(langRole);
    }
  }

  // 7. general fallback — 도메인 역할이 부족할 때
  if (roleNames.length < 3) {
    const generalMap = resolved.domainRoles.general ?? {};
    const generalRoles = generalMap[treeId] ?? generalMap.default ?? [];
    for (const r of generalRoles) addRole(r);
  }

  return roleNames.map((name) => ({ value: name, label: name }));
}
