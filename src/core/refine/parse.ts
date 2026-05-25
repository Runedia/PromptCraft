import type { RefineAssessment } from './types.js';

export class RefineParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RefineParseError';
  }
}

const FENCE_RE = /```(?:json)?\s*([\s\S]*?)```/i;
const LEVELS = ['L1', 'L2', 'L3', 'L4', 'L5'];
const VERDICTS = ['polished', 'needs-improvement'];

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

  const { level, quality, dimensions, verdict } = obj;
  if (typeof level !== 'string' || !LEVELS.includes(level)) throw new RefineParseError('bad level');
  if (typeof quality !== 'number' || quality < 0 || quality > 100) throw new RefineParseError('bad quality');
  if (!Array.isArray(dimensions) || dimensions.length === 0) throw new RefineParseError('bad dimensions');
  if (typeof verdict !== 'string' || !VERDICTS.includes(verdict)) throw new RefineParseError('bad verdict');

  const result: RefineAssessment = {
    level: level as RefineAssessment['level'],
    quality,
    dimensions: dimensions as RefineAssessment['dimensions'],
    verdict: verdict as RefineAssessment['verdict'],
    rationale: typeof obj.rationale === 'string' ? obj.rationale : undefined,
  };

  if (verdict === 'polished') {
    if (typeof obj.refined !== 'string' || obj.refined.trim() === '') throw new RefineParseError('polished requires refined');
    result.refined = obj.refined;
  } else {
    if (!Array.isArray(obj.coaching) || obj.coaching.length === 0) throw new RefineParseError('needs-improvement requires coaching');
    result.coaching = obj.coaching.map((x) => String(x));
  }
  return result;
}
