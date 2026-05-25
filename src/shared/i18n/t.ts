import en from './locales/en.json' with { type: 'json' };
import ko from './locales/ko.json' with { type: 'json' };
import type { Locale } from './types.js';

type Bundle = Record<string, unknown>;
const BUNDLES: Record<Locale, Bundle> = { ko: ko as Bundle, en: en as Bundle };

function resolveKey(bundle: Bundle, key: string): string | undefined {
  const val = key.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[part];
    return undefined;
  }, bundle);
  return typeof val === 'string' ? val : undefined;
}

/** 점표기 키를 lang 번들에서 조회하고 {{var}}를 보간한다. ko 누락 시 en, 둘 다 없으면 key 반환. */
export function t(key: string, lang: Locale, vars?: Record<string, string | number>): string {
  const raw = resolveKey(BUNDLES[lang], key) ?? (lang !== 'en' ? resolveKey(BUNDLES.en, key) : undefined) ?? key;
  if (!vars) return raw;
  return raw.replace(/\{\{(\w+)\}\}/g, (_, name: string) => (name in vars ? String(vars[name]) : `{{${name}}}`));
}
