import type { Locale } from './types.js';

/** 로케일 태그(예: 'ko-KR')를 지원 Locale로 매핑한다. */
export function localeFromTag(tag: string): Locale {
  return tag.toLowerCase().startsWith('ko') ? 'ko' : 'en';
}

/** OS/런타임 로케일을 감지한다. Intl이 OS 로케일을 반영한다(Windows 포함). */
export function detectLocale(): Locale {
  return localeFromTag(Intl.DateTimeFormat().resolvedOptions().locale);
}
