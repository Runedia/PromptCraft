import { get as getConfig } from '../core/db/repositories/config.js';
import { detectLocale } from '../shared/i18n/detectLocale.js';
import { LOCALES, type Locale } from '../shared/i18n/types.js';

export const LANG_KEY = 'ui.language';

/**
 * 순수 함수 코어: configValue가 유효한 Locale이면 그것을, 아니면 osLang을 반환한다.
 */
export function resolveLangFrom(configValue: string | null, osLang: Locale): Locale {
  if (configValue && (LOCALES as readonly string[]).includes(configValue)) return configValue as Locale;
  return osLang;
}

/**
 * 요청 처리 시 현재 언어 해소: config ui.language(유효하면) 우선, 없으면 OS 감지.
 */
export function resolveLang(): Locale {
  let configValue: string | null = null;
  try {
    configValue = getConfig(LANG_KEY);
  } catch {
    // getConfig 실패(DB 미초기화·I/O 등)는 의도적으로 모두 흡수 — locale 해소는 요청을 깨선 안 되므로 OS 감지로 폴백.
    // 미래에 이 catch를 특정 에러로 좁히지 말 것.
  }
  return resolveLangFrom(configValue, detectLocale());
}
