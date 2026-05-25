/**
 * useT / LocaleContext 인프라 검증.
 *
 * DOM/React 렌더러 없이 실행 가능한 단위 테스트만 포함한다.
 * React hook 렌더링(LocaleProvider 마운트 · useLocale throw) 테스트는
 * Stage 6 E2E(Playwright)에서 통합 검증한다.
 */
import { describe, expect, it } from 'bun:test';
import { localeFromTag } from '../../../src/shared/i18n/detectLocale.js';
import { t } from '../../../src/shared/i18n/t.js';
import { guessBrowserLang, resolveServerLang } from '../../../src/web/i18n/resolveInitialLang.js';

describe('web 로케일 번들 키 (web namespace)', () => {
  it('ko 번들에 web.settingsSheet.langKo 키가 존재한다', () => {
    expect(t('web.settingsSheet.langKo', 'ko')).toBe('한국어');
  });

  it('ko 번들에 web.settingsSheet.langEn 키가 존재한다', () => {
    expect(t('web.settingsSheet.langEn', 'ko')).toBe('English');
  });

  it('en 번들에 web.settingsSheet.langKo 키가 존재한다', () => {
    expect(t('web.settingsSheet.langKo', 'en')).toBe('Korean');
  });

  it('en 번들에 web.settingsSheet.langEn 키가 존재한다', () => {
    expect(t('web.settingsSheet.langEn', 'en')).toBe('English');
  });
});

describe('localeFromTag (첫 페인트 감지 경로)', () => {
  it('ko-KR → ko', () => {
    expect(localeFromTag('ko-KR')).toBe('ko');
  });

  it('ko → ko', () => {
    expect(localeFromTag('ko')).toBe('ko');
  });

  it('en-US → en', () => {
    expect(localeFromTag('en-US')).toBe('en');
  });

  it('fr-FR → en (미지원 언어는 en 폴백)', () => {
    expect(localeFromTag('fr-FR')).toBe('en');
  });
});

describe('guessBrowserLang (LocaleProvider 초기값 로직)', () => {
  it('navigator.language ko-KR → ko', () => {
    expect(guessBrowserLang('ko-KR')).toBe('ko');
  });

  it('navigator.language en-US → en', () => {
    expect(guessBrowserLang('en-US')).toBe('en');
  });

  it('navigator 부재(undefined) → en 폴백', () => {
    expect(guessBrowserLang(undefined)).toBe('en');
  });
});

describe('resolveServerLang — M3: browser guess≠server lang 시 server lang 반영', () => {
  it('browser=en, server=ko → ko (서버 설정이 최종 반영된다)', () => {
    // 핵심 회귀 케이스: 이전 버그는 응답 후에도 en으로 고정되었다.
    expect(resolveServerLang('en', 'ko')).toBe('ko');
  });

  it('browser=ko, server=en → en', () => {
    expect(resolveServerLang('ko', 'en')).toBe('en');
  });

  it('browser=ko, server=ko → ko (동일 시 유지)', () => {
    expect(resolveServerLang('ko', 'ko')).toBe('ko');
  });

  it('서버 응답이 잘못된 값이면 현재 lang을 유지한다', () => {
    expect(resolveServerLang('ko', 'fr')).toBe('ko');
    expect(resolveServerLang('en', undefined)).toBe('en');
    expect(resolveServerLang('en', null)).toBe('en');
  });
});

describe('useT 로직 — t() 직접 호출 동등성', () => {
  // useT()는 () => t(key, lang, vars) 를 반환한다.
  // LocaleProvider 없이 동일 시그니처를 직접 검증한다.
  it('en lang에서 test.greeting을 보간한다', () => {
    const fn = (key: string, vars?: Record<string, string | number>) => t(key, 'en', vars);
    expect(fn('test.greeting', { name: 'Rune' })).toBe('Hi Rune');
  });

  it('ko lang에서 test.greeting을 보간한다', () => {
    const fn = (key: string, vars?: Record<string, string | number>) => t(key, 'ko', vars);
    expect(fn('test.greeting', { name: '루네' })).toBe('안녕 루네');
  });

  it('lang 전환 시 다른 문자열을 반환한다', () => {
    const fnKo = (key: string) => t(key, 'ko');
    const fnEn = (key: string) => t(key, 'en');
    expect(fnKo('web.settingsSheet.langKo')).not.toBe(fnEn('web.settingsSheet.langKo'));
  });
});
