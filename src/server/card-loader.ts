import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CardDefinition } from '../core/types/card.js';

const CARDS_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../data/cards/card-definitions.json');

export const cardLoader = {
  async loadCardDefinitions(): Promise<Record<string, CardDefinition>> {
    return (await Bun.file(CARDS_FILE).json()) as Record<string, CardDefinition>;
  },
};
