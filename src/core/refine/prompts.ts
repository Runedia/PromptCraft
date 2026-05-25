import { t } from '../../shared/i18n/t.js';
import type { Locale } from '../../shared/i18n/types.js';
import { getRubricText } from './rubric.js';
import type { ChatMessage, RefineMode } from './types.js';

/** 기준표 + 모드 지시 + JSON 스키마로 system/user 메시지를 조립한다. 순수 함수. */
export function buildRefineMessages(promptText: string, lang: Locale, mode: RefineMode): ChatMessage[] {
  const directive = mode === 'polish' ? t('core.refine.polishDirective', lang) : t('core.refine.coachDirective', lang);
  const system = [t('core.refine.systemIntro', lang), '', getRubricText(lang), '', directive, '', t('core.refine.schema', lang)].join('\n');
  const user = `${t('core.refine.userIntro', lang)}\n\n${promptText}`;
  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}
