import type { I18nText, I18nTextArray, Locale } from './types.js';

export function pickText(text: I18nText, lang: Locale): string {
  return text[lang] ?? text[lang === 'ko' ? 'en' : 'ko'] ?? '';
}

export function pickArray(text: I18nTextArray, lang: Locale): string[] {
  return text[lang] ?? text[lang === 'ko' ? 'en' : 'ko'] ?? [];
}
