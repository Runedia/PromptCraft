import { t } from '../../shared/i18n/t.js';
import type { Locale } from '../../shared/i18n/types.js';
import type { ChatMessage } from './types.js';

/** 다듬기 지시 + JSON 스키마로 system/user 메시지를 조립한다. 순수 함수. */
export function buildRefineMessages(promptText: string, lang: Locale): ChatMessage[] {
  const system = [t('core.refine.systemIntro', lang), '', t('core.refine.directive', lang), '', t('core.refine.schema', lang)].join('\n');
  const user = `${t('core.refine.userIntro', lang)}\n\n${promptText}`;
  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}
