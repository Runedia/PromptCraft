const { parseMentions, parseLineRange, extractLines, inferLanguage } = require('../../../src/core/builder/mentionParser');

// ─── parseLineRange ───────────────────────────────────────────────────

describe('parseLineRange()', () => {
  test('경로 + 시작-끝 범위 파싱', () => {
    const r = parseLineRange('src/a.ts#L10-20');
    expect(r).toEqual({ filename: 'src/a.ts', lineStart: 10, lineEnd: 20 });
  });

  test('경로 + 시작 라인만', () => {
    const r = parseLineRange('src/a.ts#L5');
    expect(r).toEqual({ filename: 'src/a.ts', lineStart: 5, lineEnd: undefined });
  });

  test('라인 범위 없음', () => {
    const r = parseLineRange('src/a.ts');
    expect(r).toEqual({ filename: 'src/a.ts', lineStart: undefined, lineEnd: undefined });
  });
});

// ─── parseMentions ────────────────────────────────────────────────────

describe('parseMentions()', () => {
  test('@path#L시작-끝 전체 파싱', () => {
    const refs = parseMentions('@src/a.ts#L10-20');
    expect(refs).toHaveLength(1);
    expect(refs[0].raw).toBe('@src/a.ts#L10-20');
    expect(refs[0].filePath).toBe('src/a.ts');
    expect(refs[0].lineStart).toBe(10);
    expect(refs[0].lineEnd).toBe(20);
    expect(refs[0].offset).toBe(0);
  });

  test('@path#L시작만', () => {
    const refs = parseMentions('@src/a.ts#L5');
    expect(refs[0].lineStart).toBe(5);
    expect(refs[0].lineEnd).toBeUndefined();
  });

  test('@path 라인 범위 없음', () => {
    const refs = parseMentions('@src/a.ts');
    expect(refs[0].filePath).toBe('src/a.ts');
    expect(refs[0].lineStart).toBeUndefined();
    expect(refs[0].lineEnd).toBeUndefined();
  });

  test('텍스트 안 여러 멘션 파싱', () => {
    const refs = parseMentions('보세요 @src/a.ts#L1-3 그리고 @src/b.ts');
    expect(refs).toHaveLength(2);
    expect(refs[0].filePath).toBe('src/a.ts');
    expect(refs[1].filePath).toBe('src/b.ts');
  });

  test('멘션 없으면 빈 배열', () => {
    expect(parseMentions('그냥 텍스트')).toHaveLength(0);
  });
});

// ─── extractLines ─────────────────────────────────────────────────────

const CONTENT = '라인1\n라인2\n라인3\n라인4\n라인5';

describe('extractLines()', () => {
  test('시작-끝 범위 추출', () => {
    expect(extractLines(CONTENT, 2, 4)).toBe('라인2\n라인3\n라인4');
  });

  test('시작만 있으면 한 줄 반환', () => {
    expect(extractLines(CONTENT, 3)).toBe('라인3');
  });

  test('lineStart 없으면 전체 반환', () => {
    expect(extractLines(CONTENT)).toBe(CONTENT);
  });

  test('범위가 파일 끝을 넘으면 존재하는 줄까지만', () => {
    expect(extractLines(CONTENT, 4, 99)).toBe('라인4\n라인5');
  });
});

// ─── inferLanguage ────────────────────────────────────────────────────

describe('inferLanguage()', () => {
  test.each([
    ['foo.ts', 'typescript'],
    ['foo.tsx', 'typescript'],
    ['foo.js', 'javascript'],
    ['foo.jsx', 'javascript'],
    ['foo.py', 'python'],
    ['foo.go', 'go'],
    ['foo.rs', 'rust'],
    ['foo.md', 'markdown'],
    ['foo.json', 'json'],
  ])('%s → %s', (file, lang) => {
    expect(inferLanguage(file)).toBe(lang);
  });

  test('알 수 없는 확장자 → text', () => {
    expect(inferLanguage('foo.xyz')).toBe('text');
  });

  test('확장자 없는 파일 → text', () => {
    expect(inferLanguage('Makefile')).toBe('text');
  });
});
