jest.mock('../../../src/core/builder/domain-overlay', () => ({
  applyDomainOverrides: jest.fn((cardDefs: any) => cardDefs),
  reorderCardPool: jest.fn((pool: any) => pool),
}));

jest.mock('../../../src/core/builder/role-resolver', () => ({
  resolveRoleSuggestions: jest.fn().mockReturnValue([
    { value: '모의 역할', label: '모의 역할' },
  ]),
}));

const {
  activateCard,
  deactivateCard,
  reorderCards,
  updateCardValue,
  createCardSession,
} = require('../../../src/core/builder/cardSession');

function makeCard(overrides: any = {}) {
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
  };
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
    const c = result.find((x: any) => x.id === 'c');
    expect(c.active).toBe(true);
    expect(c.order).toBe(3);
  });

  test('active 카드가 없을 때 order=1이 된다', () => {
    const cards = [makeCard({ id: 'a', active: false, order: 0 })];
    const result = activateCard(cards, 'a');
    expect(result.find((x: any) => x.id === 'a').order).toBe(1);
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
    const a = result.find((x: any) => x.id === 'a');
    expect(a.active).toBe(false);
    expect(a.order).toBe(0);
  });

  test('required 카드는 비활성화되지 않는다', () => {
    const cards = [makeCard({ id: 'a', required: true, active: true, order: 1 })];
    const result = deactivateCard(cards, 'a');
    expect(result.find((x: any) => x.id === 'a').active).toBe(true);
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
    const cards = [
      makeCard({ id: 'a', active: true, order: 2 }),
      makeCard({ id: 'b', active: true, order: 1 }),
    ];
    const result = reorderCards(cards, ['b', 'a']);
    expect(result.find((x: any) => x.id === 'b').order).toBe(1);
    expect(result.find((x: any) => x.id === 'a').order).toBe(2);
  });

  test('orderedActiveIds에 없는 카드는 order 변경 없음', () => {
    const cards = [
      makeCard({ id: 'a', active: true, order: 1 }),
      makeCard({ id: 'pool', active: false, order: 0 }),
    ];
    const result = reorderCards(cards, ['a']);
    expect(result.find((x: any) => x.id === 'pool').order).toBe(0);
  });
});

// ─── updateCardValue ─────────────────────────────────────────────────

describe('updateCardValue()', () => {
  test('지정 카드의 value를 업데이트한다', () => {
    const cards = [makeCard({ id: 'a', value: '기존' })];
    const result = updateCardValue(cards, 'a', '새값');
    expect(result.find((x: any) => x.id === 'a').value).toBe('새값');
  });

  test('다른 카드의 value는 변경되지 않는다', () => {
    const cards = [
      makeCard({ id: 'a', value: 'A' }),
      makeCard({ id: 'b', value: 'B' }),
    ];
    const result = updateCardValue(cards, 'a', 'A-변경');
    expect(result.find((x: any) => x.id === 'b').value).toBe('B');
  });
});

// ─── createCardSession ───────────────────────────────────────────────

const CARD_DEFS = {
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
    const role = session.cards.find((c: any) => c.id === 'role');
    const stack = session.cards.find((c: any) => c.id === 'stack-environment');
    expect(role.active).toBe(true);
    expect(stack.active).toBe(false);
  });

  test('prefill 값이 카드 value에 반영된다', () => {
    const session = createCardSession(TREE_CONFIG, CARD_DEFS, null, { role: '백엔드 개발자' });
    const role = session.cards.find((c: any) => c.id === 'role');
    expect(role.value).toBe('백엔드 개발자');
  });

  test('scanResult가 있으면 stack-environment에 자동 채움', () => {
    const scan = {
      languages: [{ name: 'TypeScript', role: 'primary' }],
      frameworks: [{ name: 'Express' }],
      packageManager: 'pnpm',
      domainContext: { primary: 'web', confidence: 'high' },
    };
    const session = createCardSession(TREE_CONFIG, CARD_DEFS, scan);
    const stack = session.cards.find((c: any) => c.id === 'stack-environment');
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
  const { resolveRoleSuggestions } = require('../../../src/core/builder/role-resolver');

  const SCAN = {
    languages: [{ name: 'TypeScript', role: 'primary' }],
    frameworks: [{ name: 'React' }, { name: 'Express' }],
    packageManager: 'pnpm',
    domainContext: { primary: 'web', confidence: 'high' },
  };

  const ROLE_MAPPINGS = { web: { 'feature-dev': ['프론트엔드 개발자', 'React 개발자'] } };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('roleMappings + scanResult → resolveRoleSuggestions 호출', () => {
    createCardSession(TREE_CONFIG, CARD_DEFS, SCAN, undefined, ROLE_MAPPINGS);
    expect(resolveRoleSuggestions).toHaveBeenCalledWith(SCAN, 'feature-dev', ROLE_MAPPINGS);
  });

  test('resolveRoleSuggestions 반환값이 role 카드 options에 반영된다', () => {
    const session = createCardSession(TREE_CONFIG, CARD_DEFS, SCAN, undefined, ROLE_MAPPINGS);
    const role = session.cards.find((c: any) => c.id === 'role');
    expect(role.options).toEqual([{ value: '모의 역할', label: '모의 역할' }]);
  });

  test('roleMappings 없이 scanResult만 → buildRoleOptions 사용 (주 언어 기반 역할)', () => {
    const session = createCardSession(TREE_CONFIG, CARD_DEFS, SCAN);
    const role = session.cards.find((c: any) => c.id === 'role');
    const roleValues = role.options.map((o: any) => o.value);
    expect(roleValues[0]).toBe('TypeScript 개발자');
    expect(roleValues).toContain('React 개발자');
    expect(resolveRoleSuggestions).not.toHaveBeenCalled();
  });
});

// ─── createCardSession — domainOverlay 분기 ─────────────────────────

describe('createCardSession() — domainOverlay 분기', () => {
  const { applyDomainOverrides, reorderCardPool } = require('../../../src/core/builder/domain-overlay');

  const DOMAIN_OVERLAY = {
    domain: 'web',
    cardOverrides: {},
    cardRelevance: { 'stack-environment': 'high' as const },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('domainOverlay 전달 시 applyDomainOverrides 호출', () => {
    createCardSession(TREE_CONFIG, CARD_DEFS, null, undefined, undefined, DOMAIN_OVERLAY);
    expect(applyDomainOverrides).toHaveBeenCalledWith(
      CARD_DEFS, TREE_CONFIG.cardOverrides, DOMAIN_OVERLAY, TREE_CONFIG.id
    );
  });

  test('domainOverlay 전달 시 reorderCardPool에 cardRelevance 전달', () => {
    createCardSession(TREE_CONFIG, CARD_DEFS, null, undefined, undefined, DOMAIN_OVERLAY);
    expect(reorderCardPool).toHaveBeenCalledWith(
      TREE_CONFIG.cardPool, DOMAIN_OVERLAY.cardRelevance
    );
  });
});
