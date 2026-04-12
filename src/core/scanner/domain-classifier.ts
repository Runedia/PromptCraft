import type { DomainContext, ProgrammingDomain } from '../types/domain.js';
import type { ScanFramework, ScanLanguage } from '../types.js';

/**
 * 언어 이름 → 도메인 휴리스틱 (프레임워크 정보 없을 때 fallback).
 * confidence: 'low'
 */
const LANGUAGE_DOMAIN_HINTS: Record<string, ProgrammingDomain> = {
  Swift: 'mobile',
  Kotlin: 'mobile',
  Dart: 'mobile',
  Rust: 'systems',
  C: 'systems',
  'C++': 'systems',
  R: 'data-ml',
  Lua: 'game',
  Scala: 'data-ml',
};

/**
 * 도메인 분류 우선순위 — 같은 비율일 때 어느 도메인을 primary로 선택할지.
 * 값이 낮을수록 우선.
 */
const DOMAIN_PRIORITY: Record<ProgrammingDomain, number> = {
  'web-frontend': 1,
  'web-backend': 2,
  mobile: 3,
  'data-ml': 4,
  systems: 5,
  devops: 6,
  desktop: 7,
  cli: 8,
  game: 9,
  embedded: 10,
  general: 99,
};

/**
 * ScanResult의 frameworks와 languages로부터 프로젝트 도메인을 분류한다.
 *
 * 우선순위:
 * 1. 프레임워크 domain 필드 카운트 (high confidence)
 * 2. 2개 도메인이 근접 → primary/secondary (medium confidence)
 * 3. 프레임워크 없음 → 언어 휴리스틱 (low confidence)
 */
export function classifyDomain(frameworks: ScanFramework[], languages: ScanLanguage[]): DomainContext {
  // testing/devops 보조 도메인은 primary 분류에서 제외
  const AUXILIARY_DOMAINS = new Set<string>(['testing', 'devops', 'data-pipeline']);

  const domainCounts = new Map<ProgrammingDomain, number>();

  for (const fw of frameworks) {
    const d = fw.domain;
    if (!d || AUXILIARY_DOMAINS.has(d)) continue;
    const domain = d as ProgrammingDomain;
    domainCounts.set(domain, (domainCounts.get(domain) ?? 0) + 1);
  }

  if (domainCounts.size === 0) {
    return classifyByLanguage(languages);
  }

  // 빈도 내림차순 정렬, 동점 시 우선순위 오름차순
  const sorted = [...domainCounts.entries()].sort(([da, ca], [db, cb]) => {
    if (cb !== ca) return cb - ca;
    return (DOMAIN_PRIORITY[da] ?? 99) - (DOMAIN_PRIORITY[db] ?? 99);
  });

  const [primaryDomain, primaryCount] = sorted[0];

  if (sorted.length === 1) {
    return { primary: primaryDomain, secondary: null, confidence: 'high' };
  }

  const [secondaryDomain, secondaryCount] = sorted[1];
  const ratio = secondaryCount / primaryCount;

  if (ratio >= 0.5) {
    // 두 도메인이 근접: medium confidence, secondary 포함
    return { primary: primaryDomain, secondary: secondaryDomain, confidence: 'medium' };
  }

  return { primary: primaryDomain, secondary: null, confidence: 'high' };
}

function classifyByLanguage(languages: ScanLanguage[]): DomainContext {
  for (const lang of languages.filter((l) => l.role === 'primary')) {
    const domain = LANGUAGE_DOMAIN_HINTS[lang.name];
    if (domain) {
      return { primary: domain, secondary: null, confidence: 'low' };
    }
  }
  return { primary: 'general', secondary: null, confidence: 'low' };
}
