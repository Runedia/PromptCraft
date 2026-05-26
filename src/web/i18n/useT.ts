import { t } from '@shared/i18n/t.js';
import { useCallback } from 'react';
import { useLocale } from './LocaleContext.js';

/**
 * 현재 locale을 캡처한 t() 함수를 반환한다. LocaleProvider 내부에서만 사용 가능.
 *
 * 반환 함수는 lang이 바뀔 때만 새 참조가 된다(useCallback). 매 렌더 새 참조를 반환하면
 * t를 의존성에 둔 effect/memo가 렌더마다 재실행된다 — SettingsSheet의 config-load
 * effect([open, t])가 키 입력마다 GET /api/config를 재발화해 입력값을 저장값으로
 * 덮어쓰던 회귀의 근본 원인이었다(tests/e2e/settings.spec.ts).
 */
export function useT(): (key: string, vars?: Record<string, string | number>) => string {
  const { lang } = useLocale();
  return useCallback((key, vars) => t(key, lang, vars), [lang]);
}
