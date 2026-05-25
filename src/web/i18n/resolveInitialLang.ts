import { localeFromTag } from '@shared/i18n/detectLocale.js';
import type { Locale } from '@shared/i18n/types.js';

/**
 * 첫 페인트용 기본 lang. 서버 응답 전 브라우저 언어로 추정한다.
 * navigator 부재(테스트/SSR) 시 'en' 폴백.
 */
export function guessBrowserLang(navigatorLanguage?: string): Locale {
  return localeFromTag(navigatorLanguage ?? 'en');
}

/**
 * /api/locale 응답을 받아 적용할 최종 lang을 결정한다.
 * 응답이 유효한 Locale이면 그것을, 아니면 기존(브라우저 추정) lang을 유지한다.
 *
 * 핵심: browser guess와 server lang이 다르면 server lang이 반영되어야 한다.
 */
export function resolveServerLang(current: Locale, serverLang: unknown): Locale {
  if (serverLang === 'ko' || serverLang === 'en') return serverLang;
  return current;
}
