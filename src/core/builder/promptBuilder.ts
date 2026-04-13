import type { SectionCard } from '../types/card.js';
import { MENTION_PATTERN } from './mentionParser.js';

/**
 * @파일경로 멘션을 [@파일명](@파일경로) 마크다운 링크로 변환.
 * @src/foo/bar.ts        → [@bar.ts](@src/foo/bar.ts)
 * @src/foo/bar.ts#L10-20 → [@bar.ts#L10-20](@src/foo/bar.ts#L10-20)
 * @"path with spaces"   → [@spaces](@"path with spaces")
 */
export function resolveMentionLinks(text: string): string {
  // MENTION_PATTERN 은 /g 플래그를 갖고 있어 lastIndex 상태가 있으므로 새 인스턴스 생성
  const pattern = new RegExp(MENTION_PATTERN.source, MENTION_PATTERN.flags);
  return text.replace(pattern, (match, quotedPath: string | undefined, unquotedPath: string | undefined, ls: string | undefined, le: string | undefined) => {
    const filePath = quotedPath ?? unquotedPath ?? '';
    const basename = filePath.split('/').filter(Boolean).pop() ?? filePath;
    const rangePart = ls !== undefined ? `#L${ls}${le !== undefined ? `-${le}` : ''}` : '';
    return `[@${basename}${rangePart}](@${match.slice(1)})`;
  });
}

/**
 * active이고 value가 비어있지 않은 카드만 order 순으로 조립.
 * {{value}} 치환은 단순 문자열 replace — 첫 번째 발생만 치환해 인젝션 방지.
 */
export function buildPrompt(cards: SectionCard[]): string {
  return cards
    .filter((c) => c.active && c.value.trim() !== '')
    .sort((a, b) => a.order - b.order)
    .map((c) => substituteOnce(c.template, resolveMentionLinks(c.value.trim())))
    .join('\n\n');
}

/**
 * {{value}} 플레이스홀더를 딱 한 번만 치환한다.
 * 중첩 치환(값 안에 {{value}} 포함 시 무한 확장) 방지.
 */
export function substituteOnce(template: string, value: string): string {
  return template.replace('{{value}}', value);
}

/**
 * 프리뷰용: active 카드를 order 순으로 조립, 빈 값은 placeholder로 표시.
 */
export function buildPreview(cards: SectionCard[]): string {
  return cards
    .filter((c) => c.active)
    .sort((a, b) => a.order - b.order)
    .map((c) => {
      const header = c.template.split('\n')[0];
      const body = c.value.trim() !== '' ? resolveMentionLinks(c.value.trim()) : '_입력 대기 중..._';
      return `${header}\n${body}`;
    })
    .join('\n\n');
}
