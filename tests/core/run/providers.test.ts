import { describe, expect, test } from 'bun:test';
import { isRunTarget, PROVIDERS, RUN_TARGETS } from '../../../src/core/run/providers.js';

describe('PROVIDERS', () => {
  test('4종 provider가 정의된다', () => {
    expect(RUN_TARGETS).toEqual(['claude-code', 'gemini', 'copilot', 'codex']);
  });

  test('각 provider는 label/bin/launch를 가진다', () => {
    for (const t of RUN_TARGETS) {
      expect(PROVIDERS[t].label.length).toBeGreaterThan(0);
      expect(PROVIDERS[t].bin.length).toBeGreaterThan(0);
      expect(PROVIDERS[t].launch.length).toBeGreaterThan(0);
    }
  });

  test('copilot은 gh copilot 토큰을 쓴다', () => {
    expect(PROVIDERS.copilot.bin).toBe('gh');
    expect(PROVIDERS.copilot.launch).toEqual(['gh', 'copilot']);
  });

  test('isRunTarget 가드', () => {
    expect(isRunTarget('claude-code')).toBe(true);
    expect(isRunTarget('evil')).toBe(false);
    expect(isRunTarget(123)).toBe(false);
  });
});
