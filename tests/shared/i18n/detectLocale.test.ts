import { describe, expect, it } from 'bun:test';
import { localeFromTag } from '../../../src/shared/i18n/detectLocale.js';

describe('localeFromTag', () => {
  it('ko로 시작하면 ko', () => {
    expect(localeFromTag('ko-KR')).toBe('ko');
    expect(localeFromTag('KO')).toBe('ko');
  });
  it('그 외는 en', () => {
    expect(localeFromTag('en-US')).toBe('en');
    expect(localeFromTag('ja-JP')).toBe('en');
    expect(localeFromTag('')).toBe('en');
  });
});
