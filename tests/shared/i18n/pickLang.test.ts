import { describe, expect, it } from 'bun:test';
import { pickArray, pickText } from '../../../src/shared/i18n/pickLang.js';
import type { I18nText, I18nTextArray } from '../../../src/shared/i18n/types.js';

describe('pickText', () => {
  it('lang에 해당하는 문자열을 반환한다', () => {
    expect(pickText({ ko: '역할', en: 'Role' }, 'ko')).toBe('역할');
    expect(pickText({ ko: '역할', en: 'Role' }, 'en')).toBe('Role');
  });

  it('en 누락 시 ko로 폴백한다', () => {
    expect(pickText({ ko: '역할' } as unknown as I18nText, 'en')).toBe('역할');
  });

  it('ko 누락 시 en으로 폴백한다', () => {
    expect(pickText({ en: 'Role' } as unknown as I18nText, 'ko')).toBe('Role');
  });
});

describe('pickArray', () => {
  it('lang에 해당하는 배열을 반환한다', () => {
    expect(pickArray({ ko: ['가', '나'], en: ['a', 'b'] }, 'en')).toEqual(['a', 'b']);
    expect(pickArray({ ko: ['가', '나'], en: ['a', 'b'] }, 'ko')).toEqual(['가', '나']);
  });

  it('ko 누락 시 en으로 폴백한다', () => {
    expect(pickArray({ en: ['a'] } as unknown as I18nTextArray, 'ko')).toEqual(['a']);
  });

  it('en 누락 시 ko로 폴백한다', () => {
    expect(pickArray({ ko: ['가'] } as unknown as I18nTextArray, 'en')).toEqual(['가']);
  });
});
