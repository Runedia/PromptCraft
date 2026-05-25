import { describe, expect, test } from 'bun:test';
import { buildRefineMessages } from '../../../src/core/refine/prompts.js';

describe('buildRefineMessages', () => {
  test('system + user 2개 메시지 반환', () => {
    const msgs = buildRefineMessages('내 프롬프트', 'ko', 'polish');
    expect(msgs).toHaveLength(2);
    expect(msgs[0].role).toBe('system');
    expect(msgs[1].role).toBe('user');
  });

  test('system은 기준표 축과 스키마를 포함', () => {
    const sys = buildRefineMessages('x', 'ko', 'polish')[0].content;
    expect(sys).toContain('DECOMP');
    expect(sys).toContain('verdict');
  });

  test('user는 대상 프롬프트 텍스트를 포함', () => {
    expect(buildRefineMessages('고유텍스트42', 'ko', 'polish')[1].content).toContain('고유텍스트42');
  });

  test('mode에 따라 지시문이 다르다', () => {
    const polish = buildRefineMessages('x', 'ko', 'polish')[0].content;
    const coach = buildRefineMessages('x', 'ko', 'coach')[0].content;
    expect(polish).not.toBe(coach);
  });
});
