import { describe, expect, test } from 'bun:test';
import { t } from '../../src/shared/i18n/t.js';
import { formatRelativeTime } from '../../src/web/lib/relativeTime.js';

const now = new Date('2026-05-24T12:00:00Z');
const ko = (key: string, vars?: Record<string, string | number>) => t(key, 'ko', vars);
const en = (key: string, vars?: Record<string, string | number>) => t(key, 'en', vars);

describe('formatRelativeTime', () => {
  test('1분 미만 → 방금 전', () => {
    expect(formatRelativeTime('2026-05-24 11:59:30', ko, 'ko', now)).toBe('방금 전');
  });
  test('분 단위', () => {
    expect(formatRelativeTime('2026-05-24 11:45:00', ko, 'ko', now)).toBe('15분 전');
  });
  test('시간 단위', () => {
    expect(formatRelativeTime('2026-05-24 09:00:00', ko, 'ko', now)).toBe('3시간 전');
  });
  test('하루 전 → 어제', () => {
    expect(formatRelativeTime('2026-05-23 12:00:00', ko, 'ko', now)).toBe('어제');
  });
  test('일주일 이상 → ko 날짜 문자열(ko-KR)', () => {
    const out = formatRelativeTime('2026-05-01 12:00:00', ko, 'ko', now);
    expect(out).toMatch(/\d{4}년/);
  });
  test('일주일 이상 → en 날짜 문자열(en-US)', () => {
    const out = formatRelativeTime('2026-05-01 12:00:00', en, 'en', now);
    // en-US 'short' month → "May 1, 2026" 형식; 한국어 '년' 없음
    expect(out).not.toMatch(/년/);
    expect(out).toMatch(/2026/);
    expect(out).toMatch(/May/);
  });
});
