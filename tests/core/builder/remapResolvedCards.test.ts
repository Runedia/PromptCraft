/**
 * remapResolvedCards — 언어 전환 시 정의(label/template/options/hint)는 새 lang로 갱신하되
 * 사용자 런타임 상태(value/active/order)는 보존하는지 검증한다. value 손실 금지가 핵심 불변식.
 */
import { describe, expect, test } from 'bun:test';
import { createCardSession, remapResolvedCards } from '../../../src/core/builder/cardSession.js';
import type { CardDefinition, SectionCard } from '../../../src/core/types/card.js';

const CARD_DEFS: Record<string, CardDefinition> = {
  role: {
    label: { ko: '역할', en: 'Role' },
    required: true,
    inputType: 'text',
    template: { ko: '## 역할\n{{value}}', en: '## Role\n{{value}}' },
    hint: { ko: '역할 힌트', en: 'Role hint' },
  },
  goal: {
    label: { ko: '목표', en: 'Goal' },
    required: true,
    inputType: 'text',
    template: { ko: '## 목표\n{{value}}', en: '## Goal\n{{value}}' },
  },
  extra: {
    label: { ko: '추가', en: 'Extra' },
    required: false,
    inputType: 'text',
    template: { ko: '## 추가\n{{value}}', en: '## Extra\n{{value}}' },
  },
};

const TREE_CONFIG = {
  id: 'feature-dev',
  label: { ko: '기능 개발', en: 'Feature Dev' },
  description: { ko: '테스트', en: 'test' },
  defaultActiveCards: ['role', 'goal'],
  cardPool: ['extra'],
};

function findCard(cards: SectionCard[], id: string): SectionCard {
  const c = cards.find((x) => x.id === id);
  if (!c) throw new Error(`card not found: ${id}`);
  return c;
}

describe('remapResolvedCards()', () => {
  test('새 lang 정의를 받되 value/active/order는 현재 카드에서 보존한다', () => {
    // 현재: ko로 해소된 세션에 사용자가 값 입력 + extra 활성화 + 순서 변경
    const koSession = createCardSession(TREE_CONFIG, CARD_DEFS, null, undefined, undefined, undefined, 'ko');
    const current = koSession.cards.map((c) => {
      if (c.id === 'role') return { ...c, value: '내 역할 입력', order: 2 };
      if (c.id === 'goal') return { ...c, value: '내 목표 입력', order: 1 };
      if (c.id === 'extra') return { ...c, value: '추가 입력', active: true, order: 3 };
      return c;
    });

    // en으로 재해소된 정의
    const enSession = createCardSession(TREE_CONFIG, CARD_DEFS, null, undefined, undefined, undefined, 'en');
    const remapped = remapResolvedCards(enSession.cards, current);

    const role = findCard(remapped, 'role');
    const goal = findCard(remapped, 'goal');
    const extra = findCard(remapped, 'extra');

    // 정의 필드는 en으로 갱신
    expect(role.label).toBe('Role');
    expect(role.template).toBe('## Role\n{{value}}');
    expect(goal.label).toBe('Goal');
    expect(extra.label).toBe('Extra');

    // value 보존 (핵심 불변식)
    expect(role.value).toBe('내 역할 입력');
    expect(goal.value).toBe('내 목표 입력');
    expect(extra.value).toBe('추가 입력');

    // active/order 보존
    expect(role.order).toBe(2);
    expect(goal.order).toBe(1);
    expect(extra.active).toBe(true);
    expect(extra.order).toBe(3);
  });

  test('current에 없는 카드(resolved 신규)는 resolved 상태 그대로 둔다', () => {
    const enSession = createCardSession(TREE_CONFIG, CARD_DEFS, null, undefined, undefined, undefined, 'en');
    // current에 role만 존재 → goal/extra는 resolved 그대로
    const current: SectionCard[] = [{ ...findCard(enSession.cards, 'role'), value: 'X' }];
    const remapped = remapResolvedCards(enSession.cards, current);
    expect(findCard(remapped, 'role').value).toBe('X');
    // goal은 resolved 기본값 유지(빈 value, 정의상 active)
    expect(findCard(remapped, 'goal').value).toBe(findCard(enSession.cards, 'goal').value);
  });

  test('빈 value도 그대로 보존한다(빈→비움 회귀 방지)', () => {
    const koSession = createCardSession(TREE_CONFIG, CARD_DEFS, null, undefined, undefined, undefined, 'ko');
    const current = koSession.cards.map((c) => ({ ...c, value: '' }));
    const enSession = createCardSession(TREE_CONFIG, CARD_DEFS, null, undefined, undefined, undefined, 'en');
    const remapped = remapResolvedCards(enSession.cards, current);
    expect(remapped.every((c) => c.value === '')).toBe(true);
    expect(findCard(remapped, 'role').label).toBe('Role');
  });
});
