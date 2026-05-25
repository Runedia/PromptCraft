import { parseRefineResponse } from '../../core/refine/parse.js';
import { buildRefineMessages } from '../../core/refine/prompts.js';
import type { RefineAssessment, RefineConfig } from '../../core/refine/types.js';
import type { Locale } from '../../shared/i18n/types.js';
import { checkAvailability } from './availability.js';
import { chatComplete, type LlmClient, makeClient } from './openaiClient.js';

type ClientFactory = (cfg: RefineConfig) => LlmClient;

interface AssessOpts {
  cfg: RefineConfig;
  promptText: string;
  lang: Locale;
  createClient?: ClientFactory;
}

/** 메시지 조립 → LLM 호출 → 파싱. 네트워크 에러는 그대로, 파싱 실패는 RefineParseError로 전파. createClient 주입으로 테스트 가능. */
export async function assessPrompt(opts: AssessOpts): Promise<RefineAssessment> {
  const { model } = opts.cfg;
  if (!model) throw new Error('refine model not configured');
  const create = opts.createClient ?? makeClient;
  const client = create(opts.cfg);
  const messages = buildRefineMessages(opts.promptText, opts.lang);
  const raw = await chatComplete(client, messages, { model });
  return parseRefineResponse(raw);
}

export async function fetchStatus(
  cfg: RefineConfig,
  createClient: ClientFactory = makeClient
): Promise<{ available: boolean; models: string[]; configuredModel: string | null }> {
  const { available, models } = await checkAvailability(createClient(cfg));
  return { available, models, configuredModel: cfg.model };
}
