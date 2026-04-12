const { estimateTokens } = require('../../../src/core/builder/tokenEstimator');

describe('estimateTokens()', () => {
  test('빈 문자열은 0을 반환한다', () => {
    expect(estimateTokens('')).toBe(0);
  });

  test('null/undefined-like falsy는 0을 반환한다', () => {
    expect(estimateTokens(null as unknown as string)).toBe(0);
    expect(estimateTokens(undefined as unknown as string)).toBe(0);
  });

  test('순수 ASCII 4자 → 1토큰', () => {
    expect(estimateTokens('abcd')).toBe(1);
  });

  test('ASCII 5자 → ceil(5/4) = 2', () => {
    expect(estimateTokens('hello')).toBe(2);
  });

  test('순수 한글 2자 → 1토큰', () => {
    expect(estimateTokens('안녕')).toBe(1);
  });

  test('한글 3자 → ceil(3/2) = 2', () => {
    expect(estimateTokens('안녕하')).toBe(2);
  });

  test('혼합: 한글 2자 + ASCII 4자 → 1+1 = 2', () => {
    // 안녕(2한글) + abcd(4ASCII) = ceil(2/2) + ceil(4/4) = 1 + 1 = 2
    expect(estimateTokens('안녕abcd')).toBe(2);
  });

  test('공백과 숫자도 otherChars로 계산된다', () => {
    // '1234' = 4 chars, ceil(4/4) = 1
    expect(estimateTokens('1234')).toBe(1);
  });

  test('긴 텍스트: 400 ASCII 문자 → 100토큰', () => {
    const text = 'a'.repeat(400);
    expect(estimateTokens(text)).toBe(100);
  });

  test('긴 한글 텍스트: 200 한글 → 100토큰', () => {
    const text = '가'.repeat(200);
    expect(estimateTokens(text)).toBe(100);
  });
});
