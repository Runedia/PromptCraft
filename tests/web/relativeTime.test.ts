import { describe, expect, test } from 'bun:test';
import { formatRelativeTime } from '../../src/web/lib/relativeTime.js';

const now = new Date('2026-05-24T12:00:00Z');

describe('formatRelativeTime', () => {
  test('1분 미만 → 방금 전', () => {
    expect(formatRelativeTime('2026-05-24 11:59:30', now)).toBe('방금 전');
  });
  test('분 단위', () => {
    expect(formatRelativeTime('2026-05-24 11:45:00', now)).toBe('15분 전');
  });
  test('시간 단위', () => {
    expect(formatRelativeTime('2026-05-24 09:00:00', now)).toBe('3시간 전');
  });
  test('하루 전 → 어제', () => {
    expect(formatRelativeTime('2026-05-23 12:00:00', now)).toBe('어제');
  });
  test('일주일 이상 → 날짜 문자열', () => {
    const out = formatRelativeTime('2026-05-01 12:00:00', now);
    expect(out).toMatch(/\d{4}년/);
  });
});
