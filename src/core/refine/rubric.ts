import type { I18nText, Locale } from '../../shared/i18n/types.js';
import rubric from './vibe-rubric.json' with { type: 'json' };
import type { VibeDimension, VibeLevel } from './types.js';

export interface RubricDimension {
  code: VibeDimension;
  name: I18nText;
  levels: Record<VibeLevel, I18nText>;
}
export interface VibeRubric {
  aggregation: string;
  dimensions: RubricDimension[];
}

export function loadRubric(): VibeRubric {
  return rubric as VibeRubric;
}

/** 기준표를 LLM system prompt에 삽입할 텍스트로 직렬화한다. */
export function getRubricText(lang: Locale): string {
  const levels: VibeLevel[] = ['L1', 'L2', 'L3', 'L4', 'L5'];
  return loadRubric()
    .dimensions.map((d) => {
      const lines = levels.map((lv) => `  ${lv}: ${d.levels[lv][lang]}`).join('\n');
      return `${d.code} (${d.name[lang]}):\n${lines}`;
    })
    .join('\n\n');
}
