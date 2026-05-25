/**
 * buildPrompt i18n 헤더 테스트 — 실제 card-definitions.json 로드 후 lang별 ## 헤더 검증
 */
import fs from 'node:fs';
import path from 'node:path';
import { createCardSession } from '../../../src/core/builder/cardSession.js';
import type { CardDefinition } from '../../../src/core/types/card.js';

const { buildPrompt } = require('../../../src/core/builder/promptBuilder');

function loadCardDefs(): Record<string, CardDefinition> {
  const file = path.join(process.cwd(), 'data', 'cards', 'card-definitions.json');
  return JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, CardDefinition>;
}

const TREE_CONFIG = {
  id: 'feature-dev',
  label: { ko: '기능 개발', en: 'Feature Dev' },
  description: { ko: '테스트 트리', en: 'test tree' },
  defaultActiveCards: ['role', 'goal'],
  cardPool: [],
};

describe('buildPrompt() — i18n 헤더 (실제 card-definitions.json)', () => {
  test('lang=ko: ## 역할 헤더가 포함된다', () => {
    const defs = loadCardDefs();
    const session = createCardSession(TREE_CONFIG, defs, null, { role: 'TypeScript 개발자', goal: '기능 구현' }, undefined, undefined, 'ko');
    const prompt = buildPrompt(session.cards);
    expect(prompt).toMatch(/^## 역할$/m);
    expect(prompt).not.toMatch(/^## Role$/m);
  });

  test('lang=en: ## Role 헤더가 포함된다', () => {
    const defs = loadCardDefs();
    const session = createCardSession(TREE_CONFIG, defs, null, { role: 'TypeScript Developer', goal: 'Implement feature' }, undefined, undefined, 'en');
    const prompt = buildPrompt(session.cards);
    expect(prompt).toMatch(/^## Role$/m);
    expect(prompt).not.toMatch(/^## 역할$/m);
  });

  test('lang=en: ## Goal 헤더가 포함된다', () => {
    const defs = loadCardDefs();
    const session = createCardSession(TREE_CONFIG, defs, null, { role: 'TypeScript Developer', goal: 'Implement feature' }, undefined, undefined, 'en');
    const prompt = buildPrompt(session.cards);
    expect(prompt).toMatch(/^## Goal$/m);
    expect(prompt).not.toMatch(/^## 목표$/m);
  });

  test('lang=ko: ## 목표 헤더가 포함된다', () => {
    const defs = loadCardDefs();
    const session = createCardSession(TREE_CONFIG, defs, null, { role: 'TypeScript 개발자', goal: '기능 구현' }, undefined, undefined, 'ko');
    const prompt = buildPrompt(session.cards);
    expect(prompt).toMatch(/^## 목표$/m);
    expect(prompt).not.toMatch(/^## Goal$/m);
  });
});
