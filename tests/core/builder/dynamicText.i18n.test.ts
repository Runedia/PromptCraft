/**
 * core 동적 텍스트 lang화 테스트
 * - createCardSession: stack-environment 자동 채움 언어 전환
 * - formatTsConstraints: 언어 전환
 */
import { createCardSession, formatTsConstraints } from '../../../src/core/builder/cardSession.js';
import type { CardDefinition, SectionCard } from '../../../src/core/types/card.js';
import type { ScanResult, TsCompilerConstraints } from '../../../src/core/types.js';

// ─── 공통 픽스처 ──────────────────────────────────────────────────────

const CARD_DEFS: Record<string, CardDefinition> = {
  'stack-environment': {
    label: { ko: '스택/환경', en: 'Stack/Environment' },
    required: false,
    inputType: 'text',
    template: { ko: '## 스택/환경\n{{value}}', en: '## Stack/Environment\n{{value}}' },
  },
  role: {
    label: { ko: '역할', en: 'Role' },
    required: true,
    inputType: 'select-or-text',
    template: { ko: '## 역할\n{{value}}', en: '## Role\n{{value}}' },
  },
};

const TREE_CONFIG = {
  id: 'feature-dev',
  label: { ko: '기능 개발', en: 'Feature Dev' },
  description: { ko: '테스트', en: 'test' },
  defaultActiveCards: ['stack-environment', 'role'],
  cardPool: [],
};

const SCAN_BASE: ScanResult = {
  path: '/project',
  languages: [{ name: 'TypeScript', extension: '.ts', count: 100, percentage: 90, role: 'primary' }],
  frameworks: [{ name: 'React', version: '18.0.0', source: 'package.json' }],
  packageManager: 'npm',
  structure: { name: 'project', children: [] },
  hasEnv: false,
  configFiles: [],
  ignoreSource: 'default',
  scannedAt: new Date().toISOString(),
};

function findCard(cards: SectionCard[], id: string): SectionCard {
  const card = cards.find((c) => c.id === id);
  if (!card) throw new Error(`card not found: ${id}`);
  return card;
}

// ─── formatScanToStackEnv (via createCardSession) ─────────────────────

describe('createCardSession() stack-environment — lang화', () => {
  test('lang=ko: 언어/프레임워크/패키지매니저 한국어 레이블', () => {
    const session = createCardSession(TREE_CONFIG, CARD_DEFS, SCAN_BASE, undefined, undefined, undefined, 'ko');
    const card = findCard(session.cards, 'stack-environment');
    expect(card.value).toContain('언어:');
    expect(card.value).toContain('프레임워크:');
    expect(card.value).toContain('패키지 매니저:');
    expect(card.value).toContain('TypeScript');
    expect(card.value).toContain('React');
    expect(card.value).toContain('npm');
  });

  test('lang=en: 언어/프레임워크/패키지매니저 영어 레이블', () => {
    const session = createCardSession(TREE_CONFIG, CARD_DEFS, SCAN_BASE, undefined, undefined, undefined, 'en');
    const card = findCard(session.cards, 'stack-environment');
    expect(card.value).toContain('Languages:');
    expect(card.value).toContain('Frameworks:');
    expect(card.value).toContain('Package Manager:');
    expect(card.value).toContain('TypeScript');
    expect(card.value).toContain('React');
    expect(card.value).toContain('npm');
  });

  test('lang=ko: tsCompilerConstraints strict 포함 시 한국어 제약 라인', () => {
    const scan: ScanResult = {
      ...SCAN_BASE,
      tsCompilerConstraints: { strict: true, target: 'ES2022' },
    };
    const session = createCardSession(TREE_CONFIG, CARD_DEFS, scan, undefined, undefined, undefined, 'ko');
    const card = findCard(session.cards, 'stack-environment');
    expect(card.value).toContain('타입/문법 제약:');
    expect(card.value).toContain('strict(null·undefined 명시, 암묵 any 금지)');
    expect(card.value).toContain('target ES2022');
  });

  test('lang=en: tsCompilerConstraints strict 포함 시 영어 제약 라인', () => {
    const scan: ScanResult = {
      ...SCAN_BASE,
      tsCompilerConstraints: { strict: true, target: 'ES2022' },
    };
    const session = createCardSession(TREE_CONFIG, CARD_DEFS, scan, undefined, undefined, undefined, 'en');
    const card = findCard(session.cards, 'stack-environment');
    expect(card.value).toContain('Type/Syntax Constraints:');
    expect(card.value).toContain('strict (explicit null·undefined, no implicit any)');
    expect(card.value).toContain('target ES2022');
  });
});

// ─── buildRoleOptions (via createCardSession) ────────────────────────

describe('createCardSession() role — buildRoleOptions lang화', () => {
  test('lang=ko: 역할 옵션에 한국어 suffix', () => {
    const session = createCardSession(TREE_CONFIG, CARD_DEFS, SCAN_BASE, undefined, undefined, undefined, 'ko');
    const card = findCard(session.cards, 'role');
    const labels = card.options?.map((o) => o.label) ?? [];
    expect(labels).toContain('TypeScript 개발자');
    expect(labels).toContain('React 개발자');
    expect(labels).toContain('소프트웨어 엔지니어');
    expect(labels).toContain('풀스택 개발자');
    expect(labels).toContain('백엔드 엔지니어');
  });

  test('lang=en: 역할 옵션에 영어 suffix', () => {
    const session = createCardSession(TREE_CONFIG, CARD_DEFS, SCAN_BASE, undefined, undefined, undefined, 'en');
    const card = findCard(session.cards, 'role');
    const labels = card.options?.map((o) => o.label) ?? [];
    expect(labels).toContain('TypeScript Developer');
    expect(labels).toContain('React Developer');
    expect(labels).toContain('Software Engineer');
    expect(labels).toContain('Full-Stack Developer');
    expect(labels).toContain('Backend Engineer');
  });
});

// ─── formatTsConstraints 직접 테스트 ──────────────────────────────────

describe('formatTsConstraints() — lang 전환', () => {
  const constraints: TsCompilerConstraints = { strict: true, target: 'ES2022' };

  test('lang=ko(기본값): 한국어 출력', () => {
    const result = formatTsConstraints(constraints);
    expect(result).toContain('strict(null·undefined 명시, 암묵 any 금지)');
    expect(result).toContain('target ES2022');
  });

  test('lang=en: 영어 출력', () => {
    const result = formatTsConstraints(constraints, 'en');
    expect(result).toContain('strict (explicit null·undefined, no implicit any)');
    expect(result).toContain('target ES2022');
  });

  test('strict 없을 때 strictNullChecks + noImplicitAny 개별 처리', () => {
    const c: TsCompilerConstraints = { strictNullChecks: true, noImplicitAny: true };
    const ko = formatTsConstraints(c, 'ko');
    expect(ko).toContain('strictNullChecks(null·undefined 명시 처리)');
    expect(ko).toContain('암묵 any 금지');

    const en = formatTsConstraints(c, 'en');
    expect(en).toContain('strictNullChecks (explicit null·undefined handling)');
    expect(en).toContain('no implicit any');
  });

  test('CommonJS module', () => {
    const c: TsCompilerConstraints = { module: 'commonjs' };
    expect(formatTsConstraints(c, 'ko')).toContain('CommonJS require');
    expect(formatTsConstraints(c, 'en')).toContain('CommonJS require');
  });

  test('ESM module', () => {
    const c: TsCompilerConstraints = { module: 'ESNext' };
    expect(formatTsConstraints(c, 'ko')).toContain('ESM import 구문');
    expect(formatTsConstraints(c, 'en')).toContain('ESM import syntax');
  });

  test('verbatimModuleSyntax', () => {
    const c: TsCompilerConstraints = { verbatimModuleSyntax: true };
    expect(formatTsConstraints(c, 'ko')).toContain('type-only는 import type');
    expect(formatTsConstraints(c, 'en')).toContain('type-only imports use import type');
  });

  test('jsx', () => {
    const c: TsCompilerConstraints = { jsx: 'react-jsx' };
    expect(formatTsConstraints(c, 'ko')).toContain('JSX 사용');
    expect(formatTsConstraints(c, 'en')).toContain('JSX enabled');
  });

  test('noUncheckedIndexedAccess', () => {
    const c: TsCompilerConstraints = { noUncheckedIndexedAccess: true };
    expect(formatTsConstraints(c, 'ko')).toContain('noUncheckedIndexedAccess(인덱스 결과 undefined 체크)');
    expect(formatTsConstraints(c, 'en')).toContain('noUncheckedIndexedAccess (check undefined on index access)');
  });

  test('빈 제약은 빈 문자열 반환', () => {
    expect(formatTsConstraints({}, 'ko')).toBe('');
    expect(formatTsConstraints({}, 'en')).toBe('');
  });
});
