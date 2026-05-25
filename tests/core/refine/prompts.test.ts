import { describe, expect, test } from 'bun:test';
import { buildRefineMessages } from '../../../src/core/refine/prompts.js';

describe('buildRefineMessages', () => {
  test('system + user 2개 메시지 반환', () => {
    const msgs = buildRefineMessages('내 프롬프트', 'ko');
    expect(msgs).toHaveLength(2);
    expect(msgs[0].role).toBe('system');
    expect(msgs[1].role).toBe('user');
  });

  test('system은 다듬기 지시와 스키마를 포함, 루브릭 축은 미포함', () => {
    const sys = buildRefineMessages('x', 'ko')[0].content;
    expect(sys).toContain('refined');
    expect(sys).toContain('suggestions');
    expect(sys).not.toContain('DECOMP');
    expect(sys).not.toContain('verdict');
  });

  test('user는 대상 프롬프트 텍스트를 포함', () => {
    expect(buildRefineMessages('고유텍스트42', 'ko')[1].content).toContain('고유텍스트42');
  });

  test('en 로케일은 영어 지시문을 사용', () => {
    const sys = buildRefineMessages('x', 'en')[0].content;
    expect(sys).toContain('refine');
  });
});
