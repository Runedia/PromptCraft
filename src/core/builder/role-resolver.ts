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
 * 우선순위:
 * 1. 감지된 프레임워크별 정제 역할 (상위 2개)
 * 2. 도메인 × 트리 역할 목록
 * 3. 도메인 기본 역할 목록
 * 4. general 도메인 fallback
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

  // 1. 트리×언어/프레임워크 조합 역할 (roleSuffix가 있을 때 최우선)
  if (roleSuffix && scanResult) {
    const primaryFw = scanResult.frameworks?.[0];
    if (primaryFw) addRole(`${primaryFw.name} ${roleSuffix}`);
    const primaryLang = scanResult.languages?.find((l) => l.role === 'primary');
    if (primaryLang) addRole(`${primaryLang.name} ${roleSuffix}`);
    addRole(roleSuffix);
  }

  // 2. 프레임워크별 정제 역할 (상위 2개 프레임워크)
  if (scanResult?.frameworks) {
    let frameworkCount = 0;
    for (const fw of scanResult.frameworks) {
      const refined = roleMappings.frameworkRoles[fw.name];
      if (refined) {
        addRole(refined);
        frameworkCount++;
        if (frameworkCount >= 2) break;
      }
    }
  }

  // 3. 언어 기반 역할 (confidence=low 또는 general 도메인일 때)
  const isLowConfidence = scanResult?.domainContext?.confidence === 'low' || domain === 'general';
  if (isLowConfidence && roleMappings.languageRoles && scanResult?.languages) {
    const primaryLang = scanResult.languages.find((l) => l.role === 'primary');
    if (primaryLang) {
      const langRole = roleMappings.languageRoles[primaryLang.name];
      if (langRole) addRole(langRole);
    }
  }

  // 4. 도메인 × 트리 역할
  const treeRoles = domainMap[treeId] ?? [];
  for (const r of treeRoles) addRole(r);

  // 5. 도메인 기본 역할
  const defaultRoles = domainMap.default ?? [];
  for (const r of defaultRoles) addRole(r);

  // 6. general fallback (도메인 역할이 부족할 때)
  if (roleNames.length < 3) {
    const generalMap = roleMappings.domainRoles.general ?? {};
    const generalRoles = generalMap[treeId] ?? generalMap.default ?? [];
    for (const r of generalRoles) addRole(r);
  }

  return roleNames.map((name) => ({ value: name, label: name }));
}
