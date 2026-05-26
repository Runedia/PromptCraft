import { t } from '../../shared/i18n/t.js';
import type { Locale } from '../../shared/i18n/types.js';
import type { ChatMessage } from './types.js';

/** 다듬기 지시 + JSON 스키마로 system/user 메시지를 조립한다. 순수 함수. */
export function buildRefineMessages(promptText: string, lang: Locale): ChatMessage[] {
  return [
    { role: 'system', content: t('core.refine.systemStructured', lang) },
    { role: 'user', content: promptText },
  ];
}
