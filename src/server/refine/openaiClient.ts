import OpenAI from 'openai';
import type { ChatMessage, RefineConfig } from '../../core/refine/types.js';

/** 우리가 사용하는 OpenAI SDK 표면만 추린 구조적 인터페이스(테스트 시 fake 주입용). */
export interface LlmClient {
  chat: {
    completions: {
      create(args: {
        model: string;
        messages: ChatMessage[];
        temperature?: number;
        max_tokens?: number;
        response_format?: { type: 'json_object' };
        stream?: false;
      }): Promise<{ choices: { message: { content: string | null } }[] }>;
    };
  };
  models: { list(): Promise<{ data: { id: string }[] }> };
}

/** 로컬 엔드포인트가 인증을 무시해도 SDK는 비어있지 않은 apiKey를 요구 → 'local' 폴백. */
export function makeClient(cfg: RefineConfig): LlmClient {
  return new OpenAI({ baseURL: cfg.baseUrl, apiKey: cfg.apiKey || 'local' }) as unknown as LlmClient;
}

/** JSON mode + max_tokens로 호출한다. response_format은 LM Studio/Ollama/vllm 공통 지원 모드. */
export async function chatComplete(client: LlmClient, messages: ChatMessage[], opts: { model: string; temperature?: number }): Promise<string> {
  const res = await client.chat.completions.create({
    model: opts.model,
    messages,
    temperature: opts.temperature ?? 0.2,
    max_tokens: 4096,
    response_format: { type: 'json_object' },
    stream: false,
  });
  return res.choices[0]?.message?.content ?? '';
}
