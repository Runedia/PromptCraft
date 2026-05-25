import { describe, expect, test } from 'bun:test';
import { getRubricText, loadRubric } from '../../../src/core/refine/rubric.js';

describe('rubric', () => {
  test('6개 축 모두 존재', () => {
    const r = loadRubric();
    expect(r.dimensions.map((d) => d.code).sort()).toEqual(['CTX', 'DECOMP', 'FAIL', 'META', 'ORCH', 'VERIFY']);
  });

  test('각 축은 L1~L5 ko/en 정의를 가진다', () => {
    for (const d of loadRubric().dimensions) {
      for (const lv of ['L1', 'L2', 'L3', 'L4', 'L5'] as const) {
        expect(typeof d.levels[lv].ko).toBe('string');
        expect(d.levels[lv].ko.length).toBeGreaterThan(0);
        expect(typeof d.levels[lv].en).toBe('string');
        expect(d.levels[lv].en.length).toBeGreaterThan(0);
      }
    }
  });

  test('getRubricText(ko)는 축 이름과 L3 정의를 포함', () => {
    const text = getRubricText('ko');
    expect(text).toContain('작업 분해');
    expect(text).toContain('파일·경로·기술 스택 제공');
  });

  test('getRubricText(en)은 영어 정의를 사용', () => {
    expect(getRubricText('en')).toContain('Task decomposition');
  });
});
