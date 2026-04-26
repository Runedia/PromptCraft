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
  const AUXILIARY_DOMAINS = new Set<string>(['testing', 'devops', 'data-pipeline']);

  const domainWeights = new Map<ProgrammingDomain, number>();

  for (const fw of frameworks) {
    const d = fw.domain;
    if (!d || AUXILIARY_DOMAINS.has(d)) continue;
    const domain = d as ProgrammingDomain;
    const w = fw.weight ?? 1.0;
    domainWeights.set(domain, (domainWeights.get(domain) ?? 0) + w);
  }

  if (domainWeights.size === 0) {
    return classifyByLanguage(languages);
  }

  // 가중치 합 내림차순 정렬, 동점 시 우선순위 오름차순
  const sorted = [...domainWeights.entries()].sort(([da, wa], [db, wb]) => {
    if (wb !== wa) return wb - wa;
    return (DOMAIN_PRIORITY[da] ?? 99) - (DOMAIN_PRIORITY[db] ?? 99);
  });

  const [primaryDomain, primaryWeight] = sorted[0];

  // 가중치 임계값: >= 1.0 → high 후보, >= 0.5 → medium 후보, < 0.5 → low
  const baseConfidence = primaryWeight >= 1.0 ? 'high' : primaryWeight >= 0.5 ? 'medium' : 'low';

  if (sorted.length === 1) {
    return { primary: primaryDomain, secondary: null, confidence: baseConfidence };
  }

  const [secondaryDomain, secondaryWeight] = sorted[1];
  const ratio = secondaryWeight / primaryWeight;

  if (ratio >= 0.5) {
    // 두 도메인이 근접: medium confidence, secondary 포함
    const conf = baseConfidence === 'low' ? 'low' : 'medium';
    return { primary: primaryDomain, secondary: secondaryDomain, confidence: conf };
  }

  return { primary: primaryDomain, secondary: null, confidence: baseConfidence };
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
