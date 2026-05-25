import { describe, expect, test } from 'bun:test';
import type { ChatMessage } from '../../../src/core/refine/types.js';
import { chatComplete, type LlmClient } from '../../../src/server/refine/openaiClient.js';

function fakeClient(content: string | null): LlmClient {
  return {
    chat: { completions: { create: async () => ({ choices: [{ message: { content } }] }) } },
    models: { list: async () => ({ data: [{ id: 'm1' }] }) },
  };
}

const msgs: ChatMessage[] = [{ role: 'user', content: 'hi' }];

describe('chatComplete', () => {
  test('첫 choice의 content 반환', async () => {
    expect(await chatComplete(fakeClient('응답텍스트'), msgs, { model: 'm1' })).toBe('응답텍스트');
  });

  test('content가 null이면 빈 문자열', async () => {
    expect(await chatComplete(fakeClient(null), msgs, { model: 'm1' })).toBe('');
  });

  test('choices가 비어도 빈 문자열', async () => {
    const empty: LlmClient = {
      chat: { completions: { create: async () => ({ choices: [] }) } },
      models: { list: async () => ({ data: [] }) },
    };
    expect(await chatComplete(empty, msgs, { model: 'm1' })).toBe('');
  });
});
