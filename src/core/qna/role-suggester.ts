import type { QnASelectOption, ScanResult } from '../types.js';

function normalizeName(value: string | null | undefined): string {
  if (!value || typeof value !== 'string') return '';
  return value.toLowerCase();
}

function hasAny(values: string[], keywords: string[]): boolean {
  return keywords.some((keyword) => values.some((v) => v.includes(keyword)));
}

function suggestRoles(scanResult: ScanResult | null): QnASelectOption[] {
  if (!scanResult || typeof scanResult !== 'object') {
    return [{ value: '__custom__', label: '직접 입력' }];
  }

  const frameworks = Array.isArray(scanResult.frameworks)
    ? scanResult.frameworks.map((f) => normalizeName(f?.name))
    : [];
  const languages = Array.isArray(scanResult.languages)
    ? scanResult.languages.map((l) => normalizeName(l?.name))
    : [];

  const suggestions: string[] = [];

  function add(label: string): void {
    if (!label) return;
    if (!suggestions.includes(label)) suggestions.push(label);
  }

  if (hasAny(frameworks, ['next'])) add('Next.js 풀스택 개발자 (App Router, TypeScript)');
  if (hasAny(frameworks, ['express'])) add('Node.js 백엔드 엔지니어 (REST API)');
  if (hasAny(frameworks, ['react']) && !hasAny(frameworks, ['next']))
    add('React 프론트엔드 개발자');
  if (hasAny(frameworks, ['spring'])) add('Java 백엔드 개발자 (Spring Boot)');
  if (hasAny(frameworks, ['fastapi', 'django'])) add('Python 백엔드 개발자');
  if (hasAny(frameworks, ['flutter'])) add('Flutter/Dart 모바일 개발자');
  if (hasAny(frameworks, ['nestjs'])) add('NestJS 백엔드 개발자');
  if (hasAny(frameworks, ['vue', 'nuxt'])) add('Vue.js 프론트엔드 개발자');
  if (hasAny(frameworks, ['svelte'])) add('Svelte 프론트엔드 개발자');
  if (hasAny(frameworks, ['laravel'])) add('PHP 백엔드 개발자 (Laravel)');
  if (hasAny(frameworks, ['rails'])) add('Ruby on Rails 백엔드 개발자');

  if (hasAny(languages, ['python']) && !hasAny(frameworks, ['fastapi', 'django']))
    add('Python 개발자');
  if (hasAny(languages, ['typescript']) && frameworks.length === 0) add('TypeScript 개발자');
  if (hasAny(languages, ['javascript']) && frameworks.length === 0) add('JavaScript 개발자');
  if (hasAny(languages, ['c#'])) add('.NET / C# 개발자');
  if (hasAny(languages, ['go'])) add('Go 백엔드 엔지니어');
  if (hasAny(languages, ['java']) && !hasAny(frameworks, ['spring'])) add('Java 개발자');
  if (hasAny(languages, ['rust'])) add('Rust 시스템 개발자');
  if (hasAny(languages, ['kotlin'])) add('Kotlin 개발자');
  if (hasAny(languages, ['swift'])) add('iOS / Swift 개발자');

  const top = suggestions.slice(0, 4).map((label) => ({ value: label, label }));
  top.push({ value: '__custom__', label: '직접 입력' });
  return top;
}

function resetRoleSuggestionsCache(): void {
  // compatibility no-op: tree/session caches are elsewhere, but tests call this to signal a clean state.
}

export { resetRoleSuggestionsCache, suggestRoles };
