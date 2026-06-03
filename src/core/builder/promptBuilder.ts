import { t } from '../../shared/i18n/t.js';
import type { Locale } from '../../shared/i18n/types.js';
import type { SectionCard } from '../types/card.js';
import { MENTION_PATTERN } from './mentionParser.js';

/**
 * @파일경로 멘션을 [@파일명](@파일경로) 마크다운 링크로 변환.
 * @src/foo/bar.ts        → [@bar.ts](@src/foo/bar.ts)
 * @src/foo/bar.ts#L10-20 → [@bar.ts#L10-20](@src/foo/bar.ts#L10-20)
 * @"path with spaces"   → [@spaces](@"path with spaces")
 */
// MENTION_PATTERN 은 /g 플래그가 있어 lastIndex 상태를 가지므로 치환 전용 인스턴스를 모듈에서 1회만 생성해 재사용한다.
// String.replace(global regex)는 호출 종료 시 lastIndex를 0으로 리셋하므로, 동기 단일 스레드 환경에서 재사용이 안전하다.
const MENTION_REPLACE_RE = new RegExp(MENTION_PATTERN.source, MENTION_PATTERN.flags);

export function resolveMentionLinks(text: string): string {
  return text.replace(
    MENTION_REPLACE_RE,
    (match, quotedPath: string | undefined, unquotedPath: string | undefined, ls: string | undefined, le: string | undefined) => {
      const filePath = quotedPath ?? unquotedPath ?? '';
      const basename = filePath.split('/').filter(Boolean).pop() ?? filePath;
      const rangePart = ls !== undefined ? `#L${ls}${le !== undefined ? `-${le}` : ''}` : '';
      return `[@${basename}${rangePart}](@${match.slice(1)})`;
    }
  );
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
  // 함수형 replacement: value 안의 $&, $1, $` 등 특수 치환 시퀀스를 해석하지 않고 그대로 삽입한다.
  return template.replace('{{value}}', () => value);
}

/**
 * 프리뷰용: active 카드를 order 순으로 조립, 빈 값은 placeholder로 표시.
 */
export function buildPreview(cards: SectionCard[], lang: Locale = 'ko'): string {
  return cards
    .filter((c) => c.active)
    .sort((a, b) => a.order - b.order)
    .map((c) => {
      // 첫 개행까지만 잘라 헤더를 추출한다. split('\n') 전체 배열 할당을 피한다.
      const nl = c.template.indexOf('\n');
      const header = nl === -1 ? c.template : c.template.slice(0, nl);
      const body = c.value.trim() !== '' ? resolveMentionLinks(c.value.trim()) : t('core.preview.waiting', lang);
      return `${header}\n${body}`;
    })
    .join('\n\n');
}
