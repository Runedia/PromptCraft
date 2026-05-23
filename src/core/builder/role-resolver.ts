import type { SelectOption } from '../types/card.js';
import type { ProgrammingDomain } from '../types/domain.js';
import type { ScanResult } from '../types.js';

export interface RoleMappings {
  domainRoles: Record<string, Record<string, string[]>>;
  frameworkRoles: Record<string, string>;
  languageRoles?: Record<string, string>;
}

/**
 * 스캔 결과와 트리 유형에 따라 적응형 role 옵션 목록을 반환한다.
 *
 * 출력 순서 (5 슬롯 권장 분배):
 * 1. 트리×조합 역할 — `${Framework} ${roleSuffix}`, `${Language} ${roleSuffix}`, `${roleSuffix}` 자체
 * 2~3. base 역할 — `domainRoles[X].default` 상위 2개 (모든 트리에서 동일하게 노출되어 통일성 보장)
 * 4. 프레임워크 정제 역할 — `frameworkRoles[fw.name]` 1개
 * 5. tree-spec 역할 — `domainRoles[X][treeId]` 상위 1~2개 (트리별 차별화)
 *
 * slice는 호출자가 결정 (server는 5개, workspace role 카드는 전체).
 */
export function resolveRoleSuggestions(scanResult: ScanResult | null, treeId: string, roleMappings: RoleMappings, roleSuffix?: string): SelectOption[] {
  const domain = (scanResult?.domainContext?.primary ?? 'general') as ProgrammingDomain;
  const domainMap = roleMappings.domainRoles[domain] ?? roleMappings.domainRoles.general ?? {};

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
      const refined = roleMappings.frameworkRoles[fw.name];
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
  if (isLowConfidence && roleMappings.languageRoles && scanResult?.languages) {
    const primaryLang = scanResult.languages.find((l) => l.role === 'primary');
    if (primaryLang) {
      const langRole = roleMappings.languageRoles[primaryLang.name];
      if (langRole) addRole(langRole);
    }
  }

  // 7. general fallback — 도메인 역할이 부족할 때
  if (roleNames.length < 3) {
    const generalMap = roleMappings.domainRoles.general ?? {};
    const generalRoles = generalMap[treeId] ?? generalMap.default ?? [];
    for (const r of generalRoles) addRole(r);
  }

  return roleNames.map((name) => ({ value: name, label: name }));
}
