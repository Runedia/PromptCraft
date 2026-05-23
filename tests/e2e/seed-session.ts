import fs from 'node:fs';
import path from 'node:path';
import type { CardDefinition, SectionCard } from '../../src/core/types/card.js';

export interface SeedSession {
  treeId: string;
  projectPath: string;
  cards: SectionCard[];
  savedAt: number;
}

function pickExampleValue(def: CardDefinition, label: string): string {
  if (def.examples && def.examples.length > 0) return def.examples[0];
  if (def.options && def.options.length > 0) return def.options[0].value;
  if (def.defaultValue) return def.defaultValue;
  return `벤치마크 입력 — ${label}. 25개 카드 활성화 상태 측정용 샘플 텍스트.`;
}

export function loadCardDefinitions(): Record<string, CardDefinition> {
  const file = path.join(process.cwd(), 'data', 'cards', 'card-definitions.json');
  const raw = fs.readFileSync(file, 'utf8');
  return JSON.parse(raw) as Record<string, CardDefinition>;
}

export function buildSeedSession(treeId: string, activeCount: number): SeedSession {
  const defs = loadCardDefinitions();
  const entries = Object.entries(defs);
  const ordered = [...entries.filter(([_, def]) => def.required === true), ...entries.filter(([_, def]) => def.required !== true)];

  const cards: SectionCard[] = ordered.map(([id, def], idx) => {
    const isActive = idx < activeCount;
    return {
      id,
      label: def.label,
      required: def.required ?? false,
      active: isActive,
      order: isActive ? idx + 1 : 0,
      inputType: def.inputType,
      value: isActive ? pickExampleValue(def, def.label) : '',
      template: def.template,
      hint: def.hint,
      examples: def.examples,
      options: def.options,
      scanSuggested: def.scanSuggested ?? false,
    };
  });

  return {
    treeId,
    projectPath: '',
    cards,
    savedAt: Date.now(),
  };
}
