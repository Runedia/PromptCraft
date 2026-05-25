import type { SectionCard } from '../types/card.js';
import type { StructuralScore } from './types.js';

const UPPER_CARDS = ['constraints', 'acceptance-criteria', 'review-focus', 'output-format'];
const FILE_PATH_RE_G = /[A-Za-z0-9_./\\-]+\.[A-Za-z]{2,6}(?::\d+)?/g;
const STEP_LINE_RE = /(^|\n)\s*(\d+[.)]|[-*])\s+\S/g;
const PER_CARD = 12;
const FILE_BONUS = 16;
const STEP_BONUS = 10;
const UPPER_BONUS = 8;

/** active·비공백 카드의 occupancy + 구조 신호로 완성도(0..100)를 계산한다. LLM 무관, 결정적. */
export function structuralScore(cards: SectionCard[]): StructuralScore {
  const active = cards.filter((c) => c.active && (c.value ?? '').trim() !== '');
  const filledCards = active.map((c) => c.id);
  const allText = active.map((c) => c.value).join('\n');

  const filePaths = (allText.match(FILE_PATH_RE_G) ?? []).length;
  const stepEnumeration = (allText.match(STEP_LINE_RE) ?? []).length >= 3;
  const upperCards = filledCards.filter((id) => UPPER_CARDS.includes(id));

  let points = active.length * PER_CARD;
  if (filePaths > 0) points += FILE_BONUS;
  if (stepEnumeration) points += STEP_BONUS;
  points += upperCards.length * UPPER_BONUS;

  return {
    completeness: Math.min(100, points),
    filledCards,
    signals: { filePaths, stepEnumeration, upperCards },
    missing: UPPER_CARDS.filter((id) => !upperCards.includes(id)),
  };
}
