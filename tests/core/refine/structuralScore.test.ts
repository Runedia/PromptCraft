import { describe, expect, test } from 'bun:test';
import { structuralScore } from '../../../src/core/refine/structuralScore.js';
import type { SectionCard } from '../../../src/core/types/card.js';

function card(overrides: Partial<SectionCard>): SectionCard {
  return {
    id: 'goal',
    label: '목표',
    required: false,
    active: true,
    order: 1,
    inputType: 'text',
    value: '',
    template: '{{value}}',
    scanSuggested: false,
    ...overrides,
  };
}

describe('structuralScore', () => {
  test('빈 입력 → completeness 0, 상위 카드 4개 모두 missing', () => {
    const r = structuralScore([]);
    expect(r.completeness).toBe(0);
    expect(r.filledCards).toEqual([]);
    expect(r.signals.filePaths).toBe(0);
    expect(r.signals.stepEnumeration).toBe(false);
    expect(r.missing).toEqual(['constraints', 'acceptance-criteria', 'review-focus', 'output-format']);
  });

  test('active 비공백 카드 1개 → 12점', () => {
    const r = structuralScore([card({ value: '새 기능 추가' })]);
    expect(r.completeness).toBe(12);
    expect(r.filledCards).toEqual(['goal']);
  });

  test('active=false 또는 공백 카드는 제외', () => {
    const r = structuralScore([card({ value: '   ' }), card({ id: 'x', active: false, value: '무시' })]);
    expect(r.completeness).toBe(0);
  });

  test('파일경로 신호 → +16', () => {
    const r = structuralScore([card({ value: 'src/app.ts:42 를 고쳐줘' })]);
    expect(r.signals.filePaths).toBeGreaterThan(0);
    expect(r.completeness).toBe(12 + 16);
  });

  test('3개 이상 열거 단계 → +10', () => {
    const r = structuralScore([card({ value: '1. 분석\n2. 구현\n3. 검증' })]);
    expect(r.signals.stepEnumeration).toBe(true);
    expect(r.completeness).toBe(12 + 10);
  });

  test('상위 카드 충전 → 카드당 +8, missing 갱신', () => {
    const r = structuralScore([card({ id: 'constraints', value: 'crate 추가 금지' }), card({ id: 'review-focus', value: '경계 조건' })]);
    expect(r.completeness).toBe(2 * 12 + 2 * 8);
    expect(r.signals.upperCards.sort()).toEqual(['constraints', 'review-focus']);
    expect(r.missing.sort()).toEqual(['acceptance-criteria', 'output-format']);
  });

  test('단계가 여러 카드에 분산돼도 합산 3개 이상이면 stepEnumeration true', () => {
    const r = structuralScore([card({ id: 'a', value: '1. 분석\n2. 구현' }), card({ id: 'b', value: '3. 검증' })]);
    expect(r.signals.stepEnumeration).toBe(true);
  });

  test('completeness는 100을 넘지 않음', () => {
    const many = Array.from({ length: 12 }, (_, i) => card({ id: `c${i}`, value: 'x'.repeat(5) }));
    expect(structuralScore(many).completeness).toBe(100);
  });
});
