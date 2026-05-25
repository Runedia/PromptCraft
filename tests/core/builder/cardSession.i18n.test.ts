/**
 * createCardSession i18n 해소 테스트 — self-contained {ko,en} fixture 사용
 */
import { createCardSession } from '../../../src/core/builder/cardSession.js';
import type { CardDefinition, SectionCard } from '../../../src/core/types/card.js';

const CARD_DEFS: Record<string, CardDefinition> = {
  role: {
    label: { ko: '역할', en: 'Role' },
    required: true,
    inputType: 'select-or-text',
    template: { ko: '## 역할\n{{value}}', en: '## Role\n{{value}}' },
    hint: { ko: '역할 힌트', en: 'Role hint' },
    examples: { ko: ['TypeScript 개발자'], en: ['TypeScript Developer'] },
  },
  goal: {
    label: { ko: '목표', en: 'Goal' },
    required: true,
    inputType: 'text',
    template: { ko: '## 목표\n{{value}}', en: '## Goal\n{{value}}' },
  },
};

const TREE_CONFIG = {
  id: 'feature-dev',
  label: { ko: '기능 개발', en: 'Feature Dev' },
  description: { ko: '테스트 트리', en: 'test tree' },
  defaultActiveCards: ['role', 'goal'],
  cardPool: [],
};

function findCard(cards: SectionCard[], id: string): SectionCard {
  const card = cards.find((c) => c.id === id);
  if (!card) throw new Error(`card not found: ${id}`);
  return card;
}

describe('createCardSession() — i18n lang 해소', () => {
  test('lang=ko(기본값): label·template·hint·examples 한국어 해소', () => {
    const session = createCardSession(TREE_CONFIG, CARD_DEFS, null);
    const role = findCard(session.cards, 'role');
    expect(role.label).toBe('역할');
    expect(role.template).toBe('## 역할\n{{value}}');
    expect(role.hint).toBe('역할 힌트');
    expect(role.examples).toEqual(['TypeScript 개발자']);
  });

  test('lang=en: label·template·hint·examples 영어 해소', () => {
    const session = createCardSession(TREE_CONFIG, CARD_DEFS, null, undefined, undefined, undefined, 'en');
    const role = findCard(session.cards, 'role');
    expect(role.label).toBe('Role');
    expect(role.template).toBe('## Role\n{{value}}');
    expect(role.hint).toBe('Role hint');
    expect(role.examples).toEqual(['TypeScript Developer']);
  });

  test('lang=ko: goal label·template 한국어', () => {
    const session = createCardSession(TREE_CONFIG, CARD_DEFS, null);
    const goal = findCard(session.cards, 'goal');
    expect(goal.label).toBe('목표');
    expect(goal.template).toBe('## 목표\n{{value}}');
  });

  test('lang=en: goal label·template 영어', () => {
    const session = createCardSession(TREE_CONFIG, CARD_DEFS, null, undefined, undefined, undefined, 'en');
    const goal = findCard(session.cards, 'goal');
    expect(goal.label).toBe('Goal');
    expect(goal.template).toBe('## Goal\n{{value}}');
  });

  test('hint 없는 카드는 undefined', () => {
    const session = createCardSession(TREE_CONFIG, CARD_DEFS, null);
    const goal = findCard(session.cards, 'goal');
    expect(goal.hint).toBeUndefined();
  });

  test('examples 없는 카드는 undefined', () => {
    const session = createCardSession(TREE_CONFIG, CARD_DEFS, null);
    const goal = findCard(session.cards, 'goal');
    expect(goal.examples).toBeUndefined();
  });

  test('options가 SelectOptionDef[]이면 value·label·description이 lang에 맞게 해소된다', () => {
    const defs: Record<string, CardDefinition> = {
      scope: {
        label: { ko: '범위', en: 'Scope' },
        required: false,
        inputType: 'select-or-text',
        template: { ko: '{{value}}', en: '{{value}}' },
        options: [
          { value: { ko: '신규 구현', en: 'New implementation' }, label: { ko: '신규', en: 'New' } },
          {
            value: { ko: '기존 코드 수정', en: 'Modify existing code' },
            label: { ko: '수정', en: 'Modify' },
            description: { ko: '기존 수정', en: 'Modify existing' },
          },
        ],
      },
    };
    const tree = { ...TREE_CONFIG, defaultActiveCards: ['scope'], cardPool: [] };

    const sessionKo = createCardSession(tree, defs, null, undefined, undefined, undefined, 'ko');
    const scopeKo = findCard(sessionKo.cards, 'scope');
    expect(scopeKo.options?.[0].value).toBe('신규 구현');
    expect(scopeKo.options?.[0].label).toBe('신규');
    expect(scopeKo.options?.[1].value).toBe('기존 코드 수정');
    expect(scopeKo.options?.[1].description).toBe('기존 수정');

    const sessionEn = createCardSession(tree, defs, null, undefined, undefined, undefined, 'en');
    const scopeEn = findCard(sessionEn.cards, 'scope');
    expect(scopeEn.options?.[0].value).toBe('New implementation');
    expect(scopeEn.options?.[0].label).toBe('New');
    expect(scopeEn.options?.[1].value).toBe('Modify existing code');
    expect(scopeEn.options?.[1].description).toBe('Modify existing');
  });

  test('option에 label이 없으면(malformed) throw한다', () => {
    const defsWithBadOption = {
      scope: {
        label: { ko: '범위', en: 'Scope' },
        required: false,
        inputType: 'select-or-text',
        template: { ko: '{{value}}', en: '{{value}}' },
        // label이 누락된 malformed option
        options: [{ value: 'broken' }],
      },
    } as unknown as Record<string, CardDefinition>;
    const tree = { ...TREE_CONFIG, defaultActiveCards: ['scope'], cardPool: [] };
    expect(() => createCardSession(tree, defsWithBadOption, null, undefined, undefined, null, 'ko')).toThrow();
  });
});
