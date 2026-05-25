/**
 * trees/*.json cardOverrides i18n 해소 회귀 테스트
 * 실제 code-review 트리 + card-definitions.json으로 createCardSession을 호출해
 * cardOverrides의 hint/options가 lang별로 올바르게 해소되는지 검증한다.
 * (기존에는 trees JSON이 string이라 타입/런타임 불일치 잠재 버그가 있었음 — 이 테스트가 회귀를 막는다.)
 */
import fs from 'node:fs';
import path from 'node:path';
import { createCardSession } from '../../../src/core/builder/cardSession.js';
import type { CardDefinition, SectionCard, TreeConfig } from '../../../src/core/types/card.js';

function loadJson<T>(...segments: string[]): T {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), ...segments), 'utf8')) as T;
}

function loadTree(id: string): TreeConfig {
  return loadJson<TreeConfig>('data', 'trees', `${id}.json`);
}

function loadCardDefs(): Record<string, CardDefinition> {
  return loadJson<Record<string, CardDefinition>>('data', 'cards', 'card-definitions.json');
}

function findCard(cards: SectionCard[], id: string): SectionCard {
  const card = cards.find((c) => c.id === id);
  if (!card) throw new Error(`card not found: ${id}`);
  return card;
}

describe('createCardSession() — 실제 trees cardOverrides i18n 해소 (code-review)', () => {
  const tree = loadTree('code-review');
  const cardDefs = loadCardDefs();

  test('lang=ko: cardOverrides output-format options가 한국어로 해소된다', () => {
    const session = createCardSession(tree, cardDefs, null, undefined, undefined, undefined, 'ko');
    const outputFormat = findCard(session.cards, 'output-format');
    const labels = outputFormat.options?.map((o) => o.label) ?? [];
    const values = outputFormat.options?.map((o) => o.value) ?? [];
    expect(labels).toContain('심각도 분류표');
    expect(values.some((v) => v.includes('심각도별 분류표'))).toBe(true);
    // value도 한국어로 해소 (출력 프롬프트에 들어가는 콘텐츠)
    expect(values.every((v) => /[가-힣]/.test(v))).toBe(true);
  });

  test('lang=en: cardOverrides output-format options가 영어로 해소된다', () => {
    const session = createCardSession(tree, cardDefs, null, undefined, undefined, undefined, 'en');
    const outputFormat = findCard(session.cards, 'output-format');
    const labels = outputFormat.options?.map((o) => o.label) ?? [];
    const values = outputFormat.options?.map((o) => o.value) ?? [];
    expect(labels).toContain('Severity table');
    expect(values.some((v) => v.includes('Severity table'))).toBe(true);
    // value에 한글이 없어야 한다
    expect(values.every((v) => !/[가-힣]/.test(v))).toBe(true);
  });

  test('lang=ko: goal cardOverride hint가 한국어로 해소된다', () => {
    const session = createCardSession(tree, cardDefs, null, undefined, undefined, undefined, 'ko');
    const goal = findCard(session.cards, 'goal');
    expect(goal.hint).toBe('리뷰 목적을 구체화하려면 수정하세요. (예: PR 머지 전 안전성 확인, 레거시 리팩터링 후보 파악)');
  });

  test('lang=en: goal cardOverride hint가 영어로 해소된다', () => {
    const session = createCardSession(tree, cardDefs, null, undefined, undefined, undefined, 'en');
    const goal = findCard(session.cards, 'goal');
    expect(goal.hint).toBe('Edit to clarify the review purpose. (e.g. confirm safety before PR merge, identify legacy refactoring candidates)');
  });

  test('goal defaultValue가 lang별로 해소된다', () => {
    const ko = createCardSession(tree, cardDefs, null, undefined, undefined, undefined, 'ko');
    const en = createCardSession(tree, cardDefs, null, undefined, undefined, undefined, 'en');
    expect(findCard(ko.cards, 'goal').value).toBe('코드 리뷰');
    expect(findCard(en.cards, 'goal').value).toBe('Code review');
  });
});

describe('createCardSession() — feature-impl tree examples cardOverride i18n 해소', () => {
  const tree = loadTree('feature-impl');
  const cardDefs = loadCardDefs();

  test('lang=ko: goal examples가 한국어로 해소된다', () => {
    const session = createCardSession(tree, cardDefs, null, undefined, undefined, undefined, 'ko');
    const goal = findCard(session.cards, 'goal');
    expect(goal.examples?.[0]).toContain('이메일 로그인 API');
  });

  test('lang=en: goal examples가 영어로 해소된다', () => {
    const session = createCardSession(tree, cardDefs, null, undefined, undefined, undefined, 'en');
    const goal = findCard(session.cards, 'goal');
    expect(goal.examples?.[0]).toContain('email login API');
  });
});
