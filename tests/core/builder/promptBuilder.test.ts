import type { SectionCard } from '../../../src/core/types/card';

const { resolveMentionLinks, substituteOnce, buildPrompt, buildPreview } = require('../../../src/core/builder/promptBuilder');

// ─── resolveMentionLinks ─────────────────────────────────────────────

describe('resolveMentionLinks()', () => {
  test('@경로를 마크다운 링크로 변환한다', () => {
    expect(resolveMentionLinks('@src/foo/bar.ts')).toBe('[@bar.ts](@src/foo/bar.ts)');
  });

  test('여러 멘션을 모두 변환한다', () => {
    const result = resolveMentionLinks('@src/a.ts와 @src/b.ts');
    expect(result).toBe('[@a.ts](@src/a.ts)와 [@b.ts](@src/b.ts)');
  });

  test('파일명만 있는 경우 basename = 경로 전체', () => {
    expect(resolveMentionLinks('@readme')).toBe('[@readme](@readme)');
  });

  test('멘션이 없으면 원본 그대로 반환한다', () => {
    expect(resolveMentionLinks('그냥 텍스트')).toBe('그냥 텍스트');
  });
});

// ─── substituteOnce ──────────────────────────────────────────────────

describe('substituteOnce()', () => {
  test('{{value}}를 값으로 치환한다', () => {
    expect(substituteOnce('## 역할\n{{value}}', '개발자')).toBe('## 역할\n개발자');
  });

  test('첫 번째 {{value}}만 치환한다 (중첩 방지)', () => {
    const result = substituteOnce('{{value}} and {{value}}', '테스트');
    expect(result).toBe('테스트 and {{value}}');
  });

  test('{{value}}가 없으면 템플릿 그대로 반환한다', () => {
    expect(substituteOnce('## 고정 텍스트', '값')).toBe('## 고정 텍스트');
  });

  test('빈 값으로 치환하면 플레이스홀더가 제거된다', () => {
    expect(substituteOnce('앞{{value}}뒤', '')).toBe('앞뒤');
  });

  test('value에 {{value}}가 포함돼도 중첩 치환되지 않는다 (인젝션 방지)', () => {
    expect(substituteOnce('{{value}}', '{{value}}')).toBe('{{value}}');
  });
});

// ─── buildPrompt ─────────────────────────────────────────────────────

function makeCard(overrides: Partial<SectionCard>) {
  return {
    id: 'test',
    label: '테스트',
    required: false,
    active: true,
    order: 1,
    inputType: 'text',
    value: '기본값',
    template: '## 섹션\n{{value}}',
    ...overrides,
  };
}

describe('buildPrompt()', () => {
  test('active 카드들을 order 순으로 조립한다', () => {
    const cards = [
      makeCard({ id: 'b', order: 2, value: 'B내용', template: '{{value}}' }),
      makeCard({ id: 'a', order: 1, value: 'A내용', template: '{{value}}' }),
    ];
    expect(buildPrompt(cards)).toBe('A내용\n\nB내용');
  });

  test('inactive 카드는 제외된다', () => {
    const cards = [
      makeCard({ id: 'a', active: true, order: 1, value: '포함', template: '{{value}}' }),
      makeCard({ id: 'b', active: false, order: 2, value: '제외', template: '{{value}}' }),
    ];
    expect(buildPrompt(cards)).toBe('포함');
  });

  test('value가 비어있는 카드는 제외된다', () => {
    const cards = [
      makeCard({ id: 'a', active: true, order: 1, value: '내용', template: '{{value}}' }),
      makeCard({ id: 'b', active: true, order: 2, value: '   ', template: '{{value}}' }),
    ];
    expect(buildPrompt(cards)).toBe('내용');
  });

  test('카드가 없으면 빈 문자열을 반환한다', () => {
    expect(buildPrompt([])).toBe('');
  });

  test('@멘션이 마크다운 링크로 변환된다', () => {
    const cards = [makeCard({ value: '@src/main.ts', template: '{{value}}' })];
    expect(buildPrompt(cards)).toBe('[@main.ts](@src/main.ts)');
  });
});

// ─── resolveMentionLinks — #L 라인 범위 ──────────────────────────────

describe('resolveMentionLinks() — 라인 범위', () => {
  test('@path#L시작-끝 → 마크다운 링크', () => {
    expect(resolveMentionLinks('@src/foo.ts#L10-20')).toBe('[@foo.ts#L10-20](@src/foo.ts#L10-20)');
  });

  test('@path#L시작만 → 마크다운 링크', () => {
    expect(resolveMentionLinks('@src/foo.ts#L7')).toBe('[@foo.ts#L7](@src/foo.ts#L7)');
  });

  test('기존 형식(@file.ts) 회귀 확인', () => {
    expect(resolveMentionLinks('@src/bar.ts')).toBe('[@bar.ts](@src/bar.ts)');
  });

  test('#L 없는 멘션과 있는 멘션 혼합', () => {
    const result = resolveMentionLinks('@src/a.ts와 @src/b.ts#L1-5');
    expect(result).toBe('[@a.ts](@src/a.ts)와 [@b.ts#L1-5](@src/b.ts#L1-5)');
  });

  test('공백 이후 텍스트는 링크에 포함하지 않음', () => {
    expect(resolveMentionLinks('@run/config/modmenu.json asdfsdf')).toBe('[@modmenu.json](@run/config/modmenu.json) asdfsdf');
  });

  test('따옴표 경로를 마크다운 링크로 변환', () => {
    expect(resolveMentionLinks('@"my config/app settings.json"')).toBe('[@app settings.json](@"my config/app settings.json")');
  });

  test('따옴표 경로 + 라인 범위 변환', () => {
    expect(resolveMentionLinks('@"src/my file.ts"#L5-10')).toBe('[@my file.ts#L5-10](@"src/my file.ts"#L5-10)');
  });
});

// ─── buildPreview ────────────────────────────────────────────────────

describe('buildPreview()', () => {
  test('value가 있으면 값을 표시한다', () => {
    const cards = [makeCard({ active: true, order: 1, value: '내용', template: '## 헤더\n{{value}}' })];
    const result = buildPreview(cards);
    expect(result).toContain('내용');
    expect(result).toContain('## 헤더');
  });

  test('value가 비어있으면 플레이스홀더를 표시한다', () => {
    const cards = [makeCard({ active: true, order: 1, value: '', template: '## 헤더\n{{value}}' })];
    expect(buildPreview(cards)).toContain('_입력 대기 중..._');
  });

  test('카드가 없으면 빈 문자열을 반환한다', () => {
    expect(buildPreview([])).toBe('');
  });

  test('inactive 카드도 active=true인 카드 중에서만 필터링된다', () => {
    const cards = [
      makeCard({ id: 'a', active: true, order: 1, value: '있음', template: '{{value}}' }),
      makeCard({ id: 'b', active: false, order: 2, value: '제외', template: '{{value}}' }),
    ];
    const result = buildPreview(cards);
    expect(result).toContain('있음');
    expect(result).not.toContain('제외');
  });
});
