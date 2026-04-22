import { activateCard, createCardSession, deactivateCard, reorderCards, updateCardValue } from '../../../src/core/builder/cardSession.js';
import type { RoleMappings } from '../../../src/core/builder/role-resolver.js';
import type { CardDefinition, SectionCard, SelectOption } from '../../../src/core/types/card.js';
import type { ScanResult } from '../../../src/core/types.js';

function makeCard(overrides: Partial<SectionCard> = {}): SectionCard {
  return {
    id: 'card1',
    label: '카드1',
    required: false,
    active: false,
    order: 0,
    inputType: 'text',
    value: '',
    template: '{{value}}',
    scanSuggested: false,
    ...overrides,
  } as SectionCard;
}

// ─── activateCard ────────────────────────────────────────────────────

describe('activateCard()', () => {
  test('카드를 active로 변경하고 maxOrder+1 할당', () => {
    const cards = [
      makeCard({ id: 'a', active: true, order: 1 }),
      makeCard({ id: 'b', active: true, order: 2 }),
      makeCard({ id: 'c', active: false, order: 0 }),
    ];
    const result = activateCard(cards, 'c');
    const c = result.find((x: SectionCard) => x.id === 'c');
    expect(c.active).toBe(true);
    expect(c.order).toBe(3);
  });

  test('active 카드가 없을 때 order=1이 된다', () => {
    const cards = [makeCard({ id: 'a', active: false, order: 0 })];
    const result = activateCard(cards, 'a');
    expect(result.find((x: SectionCard) => x.id === 'a').order).toBe(1);
  });

  test('원본 배열을 변경하지 않는다 (불변)', () => {
    const cards = [makeCard({ id: 'a', active: false })];
    activateCard(cards, 'a');
    expect(cards[0].active).toBe(false);
  });
});

// ─── deactivateCard ──────────────────────────────────────────────────

describe('deactivateCard()', () => {
  test('카드를 inactive로 변경하고 order=0으로 초기화', () => {
    const cards = [makeCard({ id: 'a', active: true, order: 2 })];
    const result = deactivateCard(cards, 'a');
    const a = result.find((x: SectionCard) => x.id === 'a');
    expect(a.active).toBe(false);
    expect(a.order).toBe(0);
  });

  test('required 카드는 비활성화되지 않는다', () => {
    const cards = [makeCard({ id: 'a', required: true, active: true, order: 1 })];
    const result = deactivateCard(cards, 'a');
    expect(result.find((x: SectionCard) => x.id === 'a').active).toBe(true);
  });

  test('존재하지 않는 id는 배열 그대로 반환', () => {
    const cards = [makeCard({ id: 'a', active: true, order: 1 })];
    const result = deactivateCard(cards, 'nonexistent');
    expect(result[0].active).toBe(true);
  });
});

// ─── reorderCards ────────────────────────────────────────────────────

describe('reorderCards()', () => {
  test('orderedActiveIds 순서대로 order가 1-indexed로 할당된다', () => {
    const cards = [makeCard({ id: 'a', active: true, order: 2 }), makeCard({ id: 'b', active: true, order: 1 })];
    const result = reorderCards(cards, ['b', 'a']);
    expect(result.find((x: SectionCard) => x.id === 'b').order).toBe(1);
    expect(result.find((x: SectionCard) => x.id === 'a').order).toBe(2);
  });

  test('orderedActiveIds에 없는 카드는 order 변경 없음', () => {
    const cards = [makeCard({ id: 'a', active: true, order: 1 }), makeCard({ id: 'pool', active: false, order: 0 })];
    const result = reorderCards(cards, ['a']);
    expect(result.find((x: SectionCard) => x.id === 'pool').order).toBe(0);
  });
});

// ─── updateCardValue ─────────────────────────────────────────────────

describe('updateCardValue()', () => {
  test('지정 카드의 value를 업데이트한다', () => {
    const cards = [makeCard({ id: 'a', value: '기존' })];
    const result = updateCardValue(cards, 'a', '새값');
    expect(result.find((x: SectionCard) => x.id === 'a').value).toBe('새값');
  });

  test('다른 카드의 value는 변경되지 않는다', () => {
    const cards = [makeCard({ id: 'a', value: 'A' }), makeCard({ id: 'b', value: 'B' })];
    const result = updateCardValue(cards, 'a', 'A-변경');
    expect(result.find((x: SectionCard) => x.id === 'b').value).toBe('B');
  });
});

// ─── createCardSession ───────────────────────────────────────────────

const CARD_DEFS: Record<string, CardDefinition> = {
  role: { label: '역할', required: true, inputType: 'text', template: '## 역할\n{{value}}', defaultValue: '' },
  goal: { label: '목표', required: false, inputType: 'text', template: '## 목표\n{{value}}', defaultValue: '' },
  'stack-environment': { label: '스택', required: false, inputType: 'text', template: '## 스택\n{{value}}', defaultValue: '', scanSuggested: true },
};

const TREE_CONFIG = {
  id: 'feature-dev',
  label: '기능 개발',
  description: '기능 개발 트리',
  icon: '🛠',
  defaultActiveCards: ['role', 'goal'],
  cardPool: ['stack-environment'],
};

describe('createCardSession()', () => {
  test('treeId와 createdAt이 설정된 CardSession을 반환한다', () => {
    const session = createCardSession(TREE_CONFIG, CARD_DEFS, null);
    expect(session.treeId).toBe('feature-dev');
    expect(session.createdAt).toBeInstanceOf(Date);
  });

  test('defaultActiveCards의 카드들이 active=true, 나머지는 false', () => {
    const session = createCardSession(TREE_CONFIG, CARD_DEFS, null);
    const role = session.cards.find((c: SectionCard) => c.id === 'role');
    const stack = session.cards.find((c: SectionCard) => c.id === 'stack-environment');
    expect(role.active).toBe(true);
    expect(stack.active).toBe(false);
  });

  test('prefill 값이 카드 value에 반영된다', () => {
    const session = createCardSession(TREE_CONFIG, CARD_DEFS, null, { role: '백엔드 개발자' });
    const role = session.cards.find((c: SectionCard) => c.id === 'role');
    expect(role.value).toBe('백엔드 개발자');
  });

  test('scanResult가 있으면 stack-environment에 자동 채움', () => {
    const scan: ScanResult = {
      path: '/tmp/fixture',
      languages: [{ name: 'TypeScript', extension: '.ts', count: 1, percentage: 100, role: 'primary' }],
      frameworks: [{ name: 'Express', version: null, source: 'package.json' }],
      structure: { name: 'root', children: [] },
      packageManager: 'pnpm',
      hasEnv: false,
      configFiles: [],
      ignoreSource: 'gitignore',
      scannedAt: '2026-04-21T00:00:00.000Z',
      domainContext: { primary: 'web-frontend', secondary: null, confidence: 'high' },
    };
    const session = createCardSession(TREE_CONFIG, CARD_DEFS, scan);
    const stack = session.cards.find((c: SectionCard) => c.id === 'stack-environment');
    expect(stack.value).toContain('TypeScript');
    expect(stack.value).toContain('Express');
    expect(stack.value).toContain('pnpm');
  });

  test('존재하지 않는 카드 id가 있으면 에러를 던진다', () => {
    const badTree = { ...TREE_CONFIG, defaultActiveCards: ['nonexistent'] };
    expect(() => createCardSession(badTree, CARD_DEFS, null)).toThrow('카드 정의를 찾을 수 없습니다: nonexistent');
  });
});

// ─── createCardSession — roleMappings 분기 ───────────────────────────

describe('createCardSession() — roleMappings 분기', () => {
  const SCAN: ScanResult = {
    path: '/tmp/fixture',
    languages: [{ name: 'TypeScript', extension: '.ts', count: 1, percentage: 100, role: 'primary' }],
    frameworks: [
      { name: 'React', version: null, source: 'package.json' },
      { name: 'Express', version: null, source: 'package.json' },
    ],
    structure: { name: 'root', children: [] },
    packageManager: 'pnpm',
    hasEnv: false,
    configFiles: [],
    ignoreSource: 'gitignore',
    scannedAt: '2026-04-21T00:00:00.000Z',
    domainContext: { primary: 'web-frontend', secondary: null, confidence: 'high' },
  };

  const ROLE_MAPPINGS: RoleMappings = {
    domainRoles: {
      'web-frontend': {
        default: ['웹 개발자'],
        'feature-dev': ['프론트엔드 개발자'],
      },
      general: {
        default: ['소프트웨어 엔지니어'],
      },
    },
    frameworkRoles: {
      React: 'React 개발자',
      Express: 'Node.js 백엔드 개발자',
    },
  };

  test('roleMappings + scanResult → 프레임워크 역할이 options 최우선으로 포함된다', () => {
    const session = createCardSession(TREE_CONFIG, CARD_DEFS, SCAN, undefined, ROLE_MAPPINGS);
    const role = session.cards.find((c: SectionCard) => c.id === 'role');
    const values = role.options.map((o: SelectOption) => o.value);
    expect(values[0]).toBe('React 개발자');
    expect(values).toContain('Node.js 백엔드 개발자');
    expect(values).toContain('프론트엔드 개발자');
  });

  test('roleMappings 없이 scanResult만 → buildRoleOptions 사용 (주 언어 기반 역할)', () => {
    const session = createCardSession(TREE_CONFIG, CARD_DEFS, SCAN);
    const role = session.cards.find((c: SectionCard) => c.id === 'role');
    const roleValues = role.options.map((o: SelectOption) => o.value);
    expect(roleValues[0]).toBe('TypeScript 개발자');
    expect(roleValues).toContain('React 개발자');
  });
});

// ─── createCardSession — domainOverlay 분기 ─────────────────────────

describe('createCardSession() — domainOverlay 분기', () => {
  const CARD_DEFS_EXTENDED: Record<string, CardDefinition> = {
    ...CARD_DEFS,
    constraints: { label: '제약', required: false, inputType: 'text', template: '{{value}}', defaultValue: '' },
  };

  test('domainOverlay.cardOverrides가 카드 label에 반영된다', () => {
    const overlay = {
      domain: 'web',
      cardOverrides: { role: { label: '웹 개발 역할' } },
    };
    const session = createCardSession(TREE_CONFIG, CARD_DEFS, null, undefined, undefined, overlay);
    const role = session.cards.find((c: SectionCard) => c.id === 'role');
    expect(role.label).toBe('웹 개발 역할');
  });

  test('cardRelevance=high인 cardPool 항목이 앞으로 정렬된다', () => {
    const treeWithPool = { ...TREE_CONFIG, cardPool: ['constraints', 'stack-environment'] };
    const overlay = {
      domain: 'web',
      cardOverrides: {},
      cardRelevance: { 'stack-environment': 'high' as const, constraints: 'low' as const },
    };
    const session = createCardSession(treeWithPool, CARD_DEFS_EXTENDED, null, undefined, undefined, overlay);
    const stackIdx = session.cards.findIndex((c: SectionCard) => c.id === 'stack-environment');
    const constraintsIdx = session.cards.findIndex((c: SectionCard) => c.id === 'constraints');
    expect(stackIdx).toBeLessThan(constraintsIdx);
  });
});
