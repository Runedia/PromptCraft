import { t } from '@shared/i18n/t.js';
import { useLocale } from './LocaleContext.js';

/** 현재 locale을 캡처한 t() 함수를 반환한다. LocaleProvider 내부에서만 사용 가능. */
export function useT(): (key: string, vars?: Record<string, string | number>) => string {
  const { lang } = useLocale();
  return (key, vars) => t(key, lang, vars);
}
