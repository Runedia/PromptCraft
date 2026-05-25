import { describe, expect, test } from 'bun:test';
import type { RefineConfig } from '../../../src/core/refine/types.js';
import type { LlmClient } from '../../../src/server/refine/openaiClient.js';
import { assessPrompt, fetchStatus } from '../../../src/server/refine/refineService.js';

const cfg: RefineConfig = { baseUrl: 'http://x/v1', model: 'm1', apiKey: '', threshold: 50 };

function clientReturning(content: string): LlmClient {
  return {
    chat: { completions: { create: async () => ({ choices: [{ message: { content } }] }) } },
    models: { list: async () => ({ data: [{ id: 'm1' }] }) },
  };
}

describe('assessPrompt', () => {
  test('LLM 응답을 RefineAssessment로 반환', async () => {
    const raw = JSON.stringify({
      level: 'L3',
      quality: 70,
      dimensions: [{ dimension: 'DECOMP', level: 'L3', note: 'ok' }],
      verdict: 'polished',
      refined: '다듬음',
    });
    const r = await assessPrompt({ cfg, promptText: 'p', lang: 'ko', mode: 'polish', createClient: () => clientReturning(raw) });
    expect(r.level).toBe('L3');
    expect(r.verdict).toBe('polished');
    expect(r.refined).toBe('다듬음');
  });

  test('model 미설정 시 throw', async () => {
    expect(
      assessPrompt({ cfg: { ...cfg, model: null }, promptText: 'p', lang: 'ko', mode: 'polish', createClient: () => clientReturning('{}') })
    ).rejects.toThrow('refine model not configured');
  });
});

describe('fetchStatus', () => {
  test('model 미설정이어도 엔드포인트 도달 시 모델 목록 반환', async () => {
    const r = await fetchStatus({ ...cfg, model: null }, () => clientReturning(''));
    expect(r).toEqual({ available: true, models: ['m1'], configuredModel: null });
  });

  test('model 설정 → 도달성·모델 목록', async () => {
    const r = await fetchStatus(cfg, () => clientReturning(''));
    expect(r.available).toBe(true);
    expect(r.models).toEqual(['m1']);
    expect(r.configuredModel).toBe('m1');
  });
});
