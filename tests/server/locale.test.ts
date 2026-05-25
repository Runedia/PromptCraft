import { beforeEach, describe, expect, test } from 'bun:test';
import * as connection from '../../src/core/db/connection.js';
import { LANG_KEY, resolveLang, resolveLangFrom } from '../../src/server/locale.js';

// ─── resolveLangFrom (순수 함수, DB 불필요) ───────────────────────────
describe('resolveLangFrom', () => {
  test('config에 유효한 Locale("en") → config 값 반환', () => {
    expect(resolveLangFrom('en', 'ko')).toBe('en');
  });

  test('config에 유효한 Locale("ko") → config 값 반환', () => {
    expect(resolveLangFrom('ko', 'en')).toBe('ko');
  });

  test('config가 null → osLang 반환', () => {
    expect(resolveLangFrom(null, 'en')).toBe('en');
  });

  test('config가 null → osLang "ko" 반환', () => {
    expect(resolveLangFrom(null, 'ko')).toBe('ko');
  });

  test('config에 지원하지 않는 Locale("fr") → osLang 반환', () => {
    expect(resolveLangFrom('fr', 'ko')).toBe('ko');
  });

  test('config에 지원하지 않는 Locale("ja") → osLang 반환', () => {
    expect(resolveLangFrom('ja', 'en')).toBe('en');
  });

  test('config가 빈 문자열 → osLang 반환', () => {
    expect(resolveLangFrom('', 'ko')).toBe('ko');
  });
});

// ─── LANG_KEY 상수 ────────────────────────────────────────────────────
describe('LANG_KEY', () => {
  test('LANG_KEY 상수값이 "ui.language"이다', () => {
    expect(LANG_KEY).toBe('ui.language');
  });
});

// ─── resolveLang() throw-fallback (DB 미초기화 상태 보장) ──────────────
describe('resolveLang (DB 미초기화 폴백)', () => {
  beforeEach(() => {
    // getConfig가 throw하도록 DB 미초기화 상태를 보장한다.
    connection.closeConnection();
  });

  test('DB 미초기화 → throw 없이 유효한 Locale 반환', () => {
    expect(() => resolveLang()).not.toThrow();
    expect(['ko', 'en']).toContain(resolveLang());
  });
});
