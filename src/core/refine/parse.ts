import type { RefineAssessment } from './types.js';

export class RefineParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RefineParseError';
  }
}

const FENCE_RE = /```(?:json)?\s*([\s\S]*?)```/i;

/** LLM 원시 응답(코드펜스 가능)을 RefineAssessment로 파싱·검증한다. 실패 시 RefineParseError. */
export function parseRefineResponse(raw: string): RefineAssessment {
  const text = raw.trim();
  const fenced = text.match(FENCE_RE);
  const jsonStr = (fenced ? fenced[1] : text).trim();

  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(jsonStr) as Record<string, unknown>;
  } catch {
    throw new RefineParseError('invalid JSON');
  }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw new RefineParseError('not an object');

  const { refined, suggestions } = obj;
  if (typeof refined !== 'string' || refined.trim() === '') throw new RefineParseError('refined required');
  if (!Array.isArray(suggestions)) throw new RefineParseError('suggestions must be array');

  return {
    refined,
    suggestions: suggestions.map((x) => String(x)),
    rationale: typeof obj.rationale === 'string' ? obj.rationale : undefined,
  };
}
