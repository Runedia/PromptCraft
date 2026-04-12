import type { CardDefinition } from '../../../src/core/types/card';

const { applyDomainOverrides, reorderCardPool } = require('../../../src/core/builder/domain-overlay');

// ─── applyDomainOverrides ────────────────────────────────────────────

function makeCardDef(overrides: Partial<CardDefinition> = {}) {
  return {
    label: '기본 레이블',
    required: false,
    inputType: 'text',
    template: '{{value}}',
    ...overrides,
  };
}

describe('applyDomainOverrides()', () => {
  test('overlay 없을 때 base 정의 그대로 반환', () => {
    const defs = { role: makeCardDef({ label: 'Role' }) };
    const result = applyDomainOverrides(defs, undefined, null, 'tree1');
    expect(result.role.label).toBe('Role');
  });

  test('treeOverrides가 base를 덮어쓴다', () => {
    const defs = { role: makeCardDef({ label: 'Role' }) };
    const treeOv = { role: { label: 'Tree Role' } };
    const result = applyDomainOverrides(defs, treeOv, null, 'tree1');
    expect(result.role.label).toBe('Tree Role');
  });

  test('domainOverrides가 treeOverrides보다 우선순위가 높다', () => {
    const defs = { role: makeCardDef({ label: 'Base' }) };
    const treeOv = { role: { label: 'Tree' } };
    const domainOverlay = {
      domain: 'web',
      cardOverrides: { role: { label: 'Domain' } },
    };
    const result = applyDomainOverrides(defs, treeOv, domainOverlay, 'tree1');
    expect(result.role.label).toBe('Domain');
  });

  test('examples가 배열이면 그대로 사용', () => {
    const defs = { role: makeCardDef() };
    const domainOverlay = {
      domain: 'web',
      cardOverrides: { role: { examples: ['ex1', 'ex2'] } },
    };
    const result = applyDomainOverrides(defs, undefined, domainOverlay, 'tree1');
    expect(result.role.examples).toEqual(['ex1', 'ex2']);
  });

  test('examples가 Record이면 treeId로 조회', () => {
    const defs = { role: makeCardDef() };
    const domainOverlay = {
      domain: 'web',
      cardOverrides: { role: { examples: { tree1: ['a', 'b'], tree2: ['c'] } } },
    };
    const result = applyDomainOverrides(defs, undefined, domainOverlay, 'tree1');
    expect(result.role.examples).toEqual(['a', 'b']);
  });

  test('examples Record에 해당 treeId 없으면 examples 필드 없음', () => {
    const defs = { role: makeCardDef() };
    const domainOverlay = {
      domain: 'web',
      cardOverrides: { role: { examples: { other: ['x'] } } },
    };
    const result = applyDomainOverrides(defs, undefined, domainOverlay, 'tree1');
    expect(result.role.examples).toBeUndefined();
  });

  test('domainOverride가 없는 카드는 treeOverride까지만 적용', () => {
    const defs = {
      role: makeCardDef({ label: 'Role' }),
      goal: makeCardDef({ label: 'Goal' }),
    };
    const treeOv = { role: { hint: 'tree hint' } };
    const domainOverlay = {
      domain: 'web',
      cardOverrides: { role: { label: 'Domain Role' } },
    };
    const result = applyDomainOverrides(defs, treeOv, domainOverlay, 'tree1');
    expect(result.goal.label).toBe('Goal');
    expect(result.role.hint).toBe('tree hint');
    expect(result.role.label).toBe('Domain Role');
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
    const relevance = { 'high-card': 'high', 'mid-card': 'medium', 'low-card': 'low' };
    const result = reorderCardPool(pool, relevance);
    expect(result.indexOf('high-card')).toBeLessThan(result.indexOf('mid-card'));
    expect(result.indexOf('mid-card')).toBeLessThan(result.indexOf('low-card'));
  });

  test('relevance 없는 카드는 medium으로 간주', () => {
    const pool = ['unknown', 'high-card'];
    const relevance = { 'high-card': 'high' };
    const result = reorderCardPool(pool, relevance);
    expect(result[0]).toBe('high-card');
  });

  test('원본 배열을 변경하지 않는다 (불변)', () => {
    const pool = ['a', 'b'];
    const relevance = { a: 'low', b: 'high' };
    reorderCardPool(pool, relevance);
    expect(pool).toEqual(['a', 'b']);
  });
});
