import { applyDomainOverrides, reorderCardPool } from '../../../src/core/builder/domain-overlay.js';
import type { CardDefinition } from '../../../src/core/types/card.js';

// ─── applyDomainOverrides ────────────────────────────────────────────

function makeCardDef(overrides: Partial<CardDefinition> = {}): CardDefinition {
  return {
    label: { ko: '기본 레이블', en: 'Default Label' },
    required: false,
    inputType: 'text',
    template: { ko: '{{value}}', en: '{{value}}' },
    ...overrides,
  } as CardDefinition;
}

describe('applyDomainOverrides()', () => {
  test('overlay 없을 때 base 정의 그대로 반환', () => {
    const defs = { role: makeCardDef({ label: { ko: '역할', en: 'Role' } }) };
    const result = applyDomainOverrides(defs, undefined, null, 'tree1');
    expect(result.role.label).toEqual({ ko: '역할', en: 'Role' });
  });

  test('treeOverrides가 base를 덮어쓴다', () => {
    const defs = { role: makeCardDef({ label: { ko: '역할', en: 'Role' } }) };
    const treeOv = { role: { label: { ko: '트리 역할', en: 'Tree Role' } } };
    const result = applyDomainOverrides(defs, treeOv, null, 'tree1');
    expect(result.role.label).toEqual({ ko: '트리 역할', en: 'Tree Role' });
  });

  test('domainOverrides가 treeOverrides보다 우선순위가 높다', () => {
    const defs = { role: makeCardDef({ label: { ko: 'Base', en: 'Base' } }) };
    const treeOv = { role: { label: { ko: 'Tree', en: 'Tree' } } };
    const domainOverlay = {
      domain: 'web',
      cardOverrides: { role: { label: { ko: 'Domain', en: 'Domain' } } },
    };
    const result = applyDomainOverrides(defs, treeOv, domainOverlay, 'tree1');
    expect(result.role.label).toEqual({ ko: 'Domain', en: 'Domain' });
  });

  test('examples가 I18nTextArray이면 그대로 사용', () => {
    const defs = { role: makeCardDef() };
    const domainOverlay = {
      domain: 'web',
      cardOverrides: { role: { examples: { ko: ['ex1', 'ex2'], en: ['ex1en', 'ex2en'] } } },
    };
    const result = applyDomainOverrides(defs, undefined, domainOverlay, 'tree1');
    expect(result.role.examples).toEqual({ ko: ['ex1', 'ex2'], en: ['ex1en', 'ex2en'] });
  });

  test('examples가 Record이면 treeId로 조회', () => {
    const defs = { role: makeCardDef() };
    const domainOverlay = {
      domain: 'web',
      cardOverrides: {
        role: {
          examples: {
            tree1: { ko: ['a', 'b'], en: ['aEn', 'bEn'] },
            tree2: { ko: ['c'], en: ['cEn'] },
          },
        },
      },
    };
    const result = applyDomainOverrides(defs, undefined, domainOverlay, 'tree1');
    expect(result.role.examples).toEqual({ ko: ['a', 'b'], en: ['aEn', 'bEn'] });
  });

  test('examples Record에 해당 treeId 없으면 examples 필드 없음', () => {
    const defs = { role: makeCardDef() };
    const domainOverlay = {
      domain: 'web',
      cardOverrides: {
        role: {
          examples: {
            other: { ko: ['x'], en: ['xEn'] },
          },
        },
      },
    };
    const result = applyDomainOverrides(defs, undefined, domainOverlay, 'tree1');
    expect(result.role.examples).toBeUndefined();
  });

  test('domainOverride가 없는 카드는 treeOverride까지만 적용', () => {
    const defs = {
      role: makeCardDef({ label: { ko: '역할', en: 'Role' } }),
      goal: makeCardDef({ label: { ko: '목표', en: 'Goal' } }),
    };
    const treeOv = { role: { hint: { ko: '트리 힌트', en: 'tree hint' } } };
    const domainOverlay = {
      domain: 'web',
      cardOverrides: { role: { label: { ko: '도메인 역할', en: 'Domain Role' } } },
    };
    const result = applyDomainOverrides(defs, treeOv, domainOverlay, 'tree1');
    expect(result.goal.label).toEqual({ ko: '목표', en: 'Goal' });
    expect(result.role.hint).toEqual({ ko: '트리 힌트', en: 'tree hint' });
    expect(result.role.label).toEqual({ ko: '도메인 역할', en: 'Domain Role' });
  });
});

// ─── reorderCardPool ─────────────────────────────────────────────────

describe('reorderCardPool()', () => {
  test('relevance 없으면 원래 순서 그대로', () => {
    const pool = ['a', 'b', 'c'];
    expect(reorderCardPool(pool, undefined)).toEqual(['a', 'b', 'c']);
  });

  test('high → medium → low 순서로 정렬', () => {
    const pool = ['low-card', 'high-card', 'mid-card'];
    const relevance = { 'high-card': 'high', 'mid-card': 'medium', 'low-card': 'low' } as const;
    const result = reorderCardPool(pool, relevance);
    expect(result.indexOf('high-card')).toBeLessThan(result.indexOf('mid-card'));
    expect(result.indexOf('mid-card')).toBeLessThan(result.indexOf('low-card'));
  });

  test('relevance 없는 카드는 medium으로 간주', () => {
    const pool = ['unknown', 'high-card'];
    const relevance = { 'high-card': 'high' } as const;
    const result = reorderCardPool(pool, relevance);
    expect(result[0]).toBe('high-card');
  });

  test('원본 배열을 변경하지 않는다 (불변)', () => {
    const pool = ['a', 'b'];
    const relevance = { a: 'low', b: 'high' } as const;
    reorderCardPool(pool, relevance);
    expect(pool).toEqual(['a', 'b']);
  });
});
