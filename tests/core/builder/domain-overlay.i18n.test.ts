/**
 * domain-overlay i18n 병합 테스트 — hint/label/examples가 {ko,en} 형태로 합쳐지는지 검증
 */
import { applyDomainOverrides } from '../../../src/core/builder/domain-overlay.js';
import type { CardDefinition } from '../../../src/core/types/card.js';

function makeCardDef(overrides: Partial<CardDefinition> = {}): CardDefinition {
  return {
    label: { ko: '기본 레이블', en: 'Default Label' },
    required: false,
    inputType: 'text',
    template: { ko: '{{value}}', en: '{{value}}' },
    ...overrides,
  } as CardDefinition;
}

describe('domain-overlay — i18n 병합', () => {
  test('domainOverride의 hint({ko,en})가 결과 CardDefinition에 반영된다', () => {
    const defs = { goal: makeCardDef() };
    const domainOverlay = {
      domain: 'web',
      cardOverrides: {
        goal: { hint: { ko: '도메인 힌트', en: 'Domain hint' } },
      },
    };
    const result = applyDomainOverrides(defs, undefined, domainOverlay, 'feature-dev');
    expect(result.goal.hint).toEqual({ ko: '도메인 힌트', en: 'Domain hint' });
  });

  test('domainOverride의 label({ko,en})이 base label을 덮어쓴다', () => {
    const defs = { role: makeCardDef({ label: { ko: '역할', en: 'Role' } }) };
    const domainOverlay = {
      domain: 'web',
      cardOverrides: {
        role: { label: { ko: '웹 역할', en: 'Web Role' } },
      },
    };
    const result = applyDomainOverrides(defs, undefined, domainOverlay, 'feature-dev');
    expect(result.role.label).toEqual({ ko: '웹 역할', en: 'Web Role' });
  });

  test('domainOverride의 examples({ko:[],en:[]})가 그대로 반영된다', () => {
    const defs = { goal: makeCardDef() };
    const domainOverlay = {
      domain: 'web',
      cardOverrides: {
        goal: {
          examples: { ko: ['한국어 예시1', '한국어 예시2'], en: ['English example 1', 'English example 2'] },
        },
      },
    };
    const result = applyDomainOverrides(defs, undefined, domainOverlay, 'feature-dev');
    expect(result.goal.examples).toEqual({ ko: ['한국어 예시1', '한국어 예시2'], en: ['English example 1', 'English example 2'] });
  });

  test('examples가 Record<treeId, {ko,en}>이면 treeId로 조회된다', () => {
    const defs = { goal: makeCardDef() };
    const domainOverlay = {
      domain: 'web',
      cardOverrides: {
        goal: {
          examples: {
            'feature-dev': { ko: ['기능 개발 예시'], en: ['Feature dev example'] },
            'error-solving': { ko: ['에러 해결 예시'], en: ['Error solving example'] },
          },
        },
      },
    };
    const result = applyDomainOverrides(defs, undefined, domainOverlay, 'feature-dev');
    expect(result.goal.examples).toEqual({ ko: ['기능 개발 예시'], en: ['Feature dev example'] });
  });

  test('examples Record에 해당 treeId 없으면 undefined', () => {
    const defs = { goal: makeCardDef() };
    const domainOverlay = {
      domain: 'web',
      cardOverrides: {
        goal: {
          examples: {
            'other-tree': { ko: ['다른 트리'], en: ['Other tree'] },
          },
        },
      },
    };
    const result = applyDomainOverrides(defs, undefined, domainOverlay, 'feature-dev');
    expect(result.goal.examples).toBeUndefined();
  });

  test('treeOverrides hint({ko,en})도 병합된다', () => {
    const defs = { goal: makeCardDef() };
    const treeOv = { goal: { hint: { ko: '트리 힌트', en: 'Tree hint' } } };
    const result = applyDomainOverrides(defs, treeOv, null, 'feature-dev');
    expect(result.goal.hint).toEqual({ ko: '트리 힌트', en: 'Tree hint' });
  });

  test('domainOverride hint가 treeOverride hint를 덮어쓴다', () => {
    const defs = { goal: makeCardDef() };
    const treeOv = { goal: { hint: { ko: '트리 힌트', en: 'Tree hint' } } };
    const domainOverlay = {
      domain: 'web',
      cardOverrides: { goal: { hint: { ko: '도메인 힌트', en: 'Domain hint' } } },
    };
    const result = applyDomainOverrides(defs, treeOv, domainOverlay, 'feature-dev');
    expect(result.goal.hint).toEqual({ ko: '도메인 힌트', en: 'Domain hint' });
  });
});
