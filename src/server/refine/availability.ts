import type { LlmClient } from './openaiClient.js';

/** 엔드포인트 도달성 + 서빙 모델 id 목록. 실패는 available:false로 흡수(graceful degradation). */
export async function checkAvailability(client: LlmClient): Promise<{ available: boolean; models: string[] }> {
  try {
    const page = await client.models.list();
    return { available: true, models: page.data.map((m) => m.id) };
  } catch {
    return { available: false, models: [] };
  }
}
