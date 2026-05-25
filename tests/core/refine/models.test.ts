import { describe, expect, test } from 'bun:test';
import { isRefineModelId, REFINE_MODELS } from '../../../src/core/refine/models.js';

describe('REFINE_MODELS', () => {
  test('권장 모델 2종 포함', () => {
    const ids = REFINE_MODELS.map((m) => m.id);
    expect(ids).toContain('gemma-4-E4B-it');
    expect(ids).toContain('Qwen3.5-9B');
  });

  test('tier는 light 또는 quality', () => {
    for (const m of REFINE_MODELS) expect(['light', 'quality']).toContain(m.tier);
  });

  test('isRefineModelId', () => {
    expect(isRefineModelId('gemma-4-E4B-it')).toBe(true);
    expect(isRefineModelId('unknown')).toBe(false);
  });
});
