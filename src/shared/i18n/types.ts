export type Locale = 'ko' | 'en';

export const LOCALES: readonly Locale[] = ['ko', 'en'] as const;

/** 단일 다국어 문자열 */
export interface I18nText {
  ko: string;
  en: string;
}

/** 다국어 문자열 배열(examples 등) */
export interface I18nTextArray {
  ko: string[];
  en: string[];
}
