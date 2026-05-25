import { config } from '../../core/db/index.js';
import type { RefineConfig } from '../../core/refine/types.js';

const DEFAULTS = { baseUrl: 'http://localhost:1234/v1', apiKey: '', threshold: 50 };

/** DB config 저장소에서 refine.* 키를 읽고 기본값을 적용한다. model 미설정 시 null(비활성 게이트). */
export function getRefineConfig(): RefineConfig {
  const baseUrl = config.get('refine.baseUrl') ?? DEFAULTS.baseUrl;
  const model = config.get('refine.model');
  const apiKey = config.get('refine.apiKey') ?? DEFAULTS.apiKey;
  // Number(null) === 0 이라 null이 isFinite를 통과해 0이 되는 것을 막기 위해 명시적으로 분기한다.
  // threshold 0은 유효값(완성도가 항상 임계값 이상 → belowThreshold 항상 false, advisory note 미표시)으로 의도적으로 허용한다.
  const rawThreshold = config.get('refine.threshold');
  const parsed = rawThreshold === null ? Number.NaN : Number(rawThreshold);
  const threshold = Number.isFinite(parsed) ? parsed : DEFAULTS.threshold;
  return { baseUrl, model: model && model.trim() !== '' ? model : null, apiKey, threshold };
}
