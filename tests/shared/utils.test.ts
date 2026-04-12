import os from 'node:os';
import path from 'node:path';

const { resolvePath, nowISO, formatDate, truncate, estimateTokens, toJson, fromJson, formatDuration } =
  require('../../src/shared/utils');

// ─── resolvePath ─────────────────────────────────────────────────────

describe('resolvePath()', () => {
  test('falsy 값은 process.cwd()를 반환한다', () => {
    expect(resolvePath('')).toBe(process.cwd());
    expect(resolvePath(null)).toBe(process.cwd());
    expect(resolvePath(undefined)).toBe(process.cwd());
  });

  test('~ 로 시작하면 홈 디렉토리로 확장한다', () => {
    expect(resolvePath('~/foo')).toBe(path.join(os.homedir(), '/foo'));
  });

  test('절대 경로는 그대로 반환한다', () => {
    const abs = path.resolve('/tmp/test');
    expect(resolvePath('/tmp/test')).toBe(abs);
  });

  test('상대 경로는 절대 경로로 변환한다', () => {
    const result = resolvePath('foo/bar');
    expect(path.isAbsolute(result)).toBe(true);
  });
});

// ─── nowISO ──────────────────────────────────────────────────────────

describe('nowISO()', () => {
  test('ISO8601 형식 문자열을 반환한다', () => {
    const result = nowISO();
    expect(() => new Date(result)).not.toThrow();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});

// ─── formatDate ──────────────────────────────────────────────────────

describe('formatDate()', () => {
  test('"YYYY-MM-DD HH:mm" 형식으로 반환한다', () => {
    const result = formatDate('2025-06-15T09:05:00.000Z');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
  });

  test('월/일/시/분이 2자리로 패딩된다', () => {
    // UTC 기준 01-01 00:00 → 로컬 변환이 있을 수 있으나 형식은 동일
    const result = formatDate('2025-01-01T00:00:00.000Z');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
  });
});

// ─── truncate ────────────────────────────────────────────────────────

describe('truncate()', () => {
  test('maxLength 이하이면 원본 그대로 반환한다', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  test('maxLength 초과 시 "..."를 붙여 자른다', () => {
    const result = truncate('abcdefghij', 5);
    expect(result).toBe('ab...');
    expect(result.length).toBe(5);
  });

  test('기본 maxLength는 80이다', () => {
    const long = 'a'.repeat(100);
    const result = truncate(long);
    expect(result.length).toBe(80);
    expect(result.endsWith('...')).toBe(true);
  });

  test('falsy 값은 그대로 반환한다', () => {
    expect(truncate('')).toBeFalsy();
    expect(truncate(null)).toBeNull();
  });
});

// ─── estimateTokens ──────────────────────────────────────────────────

describe('estimateTokens() — shared/utils (ASCII only)', () => {
  test('빈 문자열은 0을 반환한다', () => {
    expect(estimateTokens('')).toBe(0);
    expect(estimateTokens(null)).toBe(0);
  });

  test('4자 ASCII → 1토큰', () => {
    expect(estimateTokens('abcd')).toBe(1);
  });

  test('5자 → ceil(5/4) = 2', () => {
    expect(estimateTokens('abcde')).toBe(2);
  });
});

// ─── toJson / fromJson ───────────────────────────────────────────────

describe('toJson()', () => {
  test('객체를 JSON 문자열로 직렬화한다', () => {
    expect(toJson({ a: 1 })).toBe('{"a":1}');
  });

  test('배열도 직렬화한다', () => {
    expect(toJson([1, 2])).toBe('[1,2]');
  });
});

describe('fromJson()', () => {
  test('JSON 문자열을 객체로 파싱한다', () => {
    expect(fromJson('{"a":1}')).toEqual({ a: 1 });
  });

  test('falsy 입력은 null을 반환한다', () => {
    expect(fromJson('')).toBeNull();
    expect(fromJson(null)).toBeNull();
  });

  test('유효하지 않은 JSON은 null을 반환한다', () => {
    expect(fromJson('not-json')).toBeNull();
    expect(fromJson('{broken')).toBeNull();
  });
});

// ─── formatDuration ──────────────────────────────────────────────────

describe('formatDuration()', () => {
  test('ms를 "X.XXs" 형식으로 변환한다', () => {
    expect(formatDuration(1000)).toBe('1.00s');
    expect(formatDuration(1234)).toBe('1.23s');
    expect(formatDuration(500)).toBe('0.50s');
  });
});
