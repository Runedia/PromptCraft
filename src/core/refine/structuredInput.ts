import { resolveMentionLinks } from '../builder/promptBuilder.js';
import type { SectionCard } from '../types/card.js';
import type { Locale } from '../../shared/i18n/types.js';
import { t } from '../../shared/i18n/t.js';

export function buildStructuredRefineInput(cards: SectionCard[], lang: Locale): string {
  const active = cards.filter((c) => c.active).sort((a, b) => a.order - b.order);
  const filled = active.filter((c) => c.value.trim() !== '');
  const empty = active.filter((c) => c.value.trim() === '');

  const parts: string[] = [];

  parts.push(t('core.refine.structuredHeader', lang));
  for (const c of filled) {
    parts.push(`[${c.label} (${c.id})]\n${resolveMentionLinks(c.value.trim())}`);
  }
  if (empty.length > 0) {
    parts.push('');
    parts.push(t('core.refine.structuredEmpty', lang));
    for (const c of empty) {
      parts.push(`- [${c.label} (${c.id})]`);
    }
  }
  return parts.join('\n\n');
}
