/**
 * buildPreview placeholder lang화 테스트
 */
import { buildPreview } from '../../../src/core/builder/promptBuilder.js';
import type { SectionCard } from '../../../src/core/types/card.js';

function makeCard(overrides: Partial<SectionCard> = {}): SectionCard {
  return {
    id: 'card1',
    label: '카드1',
    required: false,
    active: true,
    order: 1,
    inputType: 'text',
    value: '',
    template: '## 역할\n{{value}}',
    scanSuggested: false,
    ...overrides,
  } as SectionCard;
}

describe('buildPreview() — placeholder lang화', () => {
  test('lang=ko(기본값): 빈 값 카드에 한국어 placeholder', () => {
    const cards = [makeCard({ id: 'role', value: '', template: '## 역할\n{{value}}' })];
    const result = buildPreview(cards);
    expect(result).toContain('_입력 대기 중..._');
  });

  test('lang=en: 빈 값 카드에 영어 placeholder', () => {
    const cards = [makeCard({ id: 'role', value: '', template: '## Role\n{{value}}' })];
    const result = buildPreview(cards, 'en');
    expect(result).toContain('_Waiting for input..._');
  });

  test('lang=ko: 값이 있는 카드는 placeholder 없이 실제 값', () => {
    const cards = [makeCard({ id: 'role', value: 'TypeScript 개발자', template: '## 역할\n{{value}}' })];
    const result = buildPreview(cards, 'ko');
    expect(result).toContain('TypeScript 개발자');
    expect(result).not.toContain('_입력 대기 중..._');
  });

  test('lang=en: 값이 있는 카드는 placeholder 없이 실제 값', () => {
    const cards = [makeCard({ id: 'role', value: 'TypeScript Developer', template: '## Role\n{{value}}' })];
    const result = buildPreview(cards, 'en');
    expect(result).toContain('TypeScript Developer');
    expect(result).not.toContain('_Waiting for input..._');
  });

  test('inactive 카드는 결과에 포함되지 않는다', () => {
    const cards = [
      makeCard({ id: 'a', active: true, order: 1, value: '', template: '## A\n{{value}}' }),
      makeCard({ id: 'b', active: false, order: 0, value: '', template: '## B\n{{value}}' }),
    ];
    const result = buildPreview(cards, 'ko');
    expect(result).toContain('## A');
    expect(result).not.toContain('## B');
  });

  test('여러 카드가 order 순으로 조립된다', () => {
    const cards = [
      makeCard({ id: 'b', active: true, order: 2, value: 'second', template: '## B\n{{value}}' }),
      makeCard({ id: 'a', active: true, order: 1, value: 'first', template: '## A\n{{value}}' }),
    ];
    const result = buildPreview(cards, 'ko');
    const idxA = result.indexOf('## A');
    const idxB = result.indexOf('## B');
    expect(idxA).toBeLessThan(idxB);
  });
});
