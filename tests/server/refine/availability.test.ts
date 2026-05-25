import { describe, expect, test } from 'bun:test';
import { checkAvailability } from '../../../src/server/refine/availability.js';
import type { LlmClient } from '../../../src/server/refine/openaiClient.js';

const okClient: LlmClient = {
  chat: { completions: { create: async () => ({ choices: [] }) } },
  models: { list: async () => ({ data: [{ id: 'a' }, { id: 'b' }] }) },
};
const throwingClient: LlmClient = {
  chat: { completions: { create: async () => ({ choices: [] }) } },
  models: {
    list: async () => {
      throw new Error('ECONNREFUSED');
    },
  },
};

describe('checkAvailability', () => {
  test('모델 목록 반환 시 available true', async () => {
    expect(await checkAvailability(okClient)).toEqual({ available: true, models: ['a', 'b'] });
  });

  test('호출 실패 시 available false', async () => {
    expect(await checkAvailability(throwingClient)).toEqual({ available: false, models: [] });
  });
});
