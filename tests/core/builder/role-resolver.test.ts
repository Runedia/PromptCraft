const { resolveRoleSuggestions } = require('../../../src/core/builder/role-resolver');

function makeScan(overrides: any = {}) {
  return {
    languages: [],
    frameworks: [],
    packageManager: null,
    domainContext: { primary: 'general', confidence: 'medium' },
    ...overrides,
  };
}

const BASE_MAPPINGS = {
  domainRoles: {
    general: {
      default: ['소프트웨어 엔지니어', '풀스택 개발자'],
      'code-review': ['코드 리뷰어'],
    },
    web: {
      default: ['웹 개발자', 'UI 엔지니어'],
      'code-review': ['프론트엔드 리뷰어'],
    },
  },
  frameworkRoles: {
    React: 'React 개발자',
    Express: 'Node.js 백엔드 개발자',
  },
  languageRoles: {
    TypeScript: 'TypeScript 개발자',
    Python: 'Python 개발자',
  },
};

// ─── 기본 동작 ───────────────────────────────────────────────────────

describe('resolveRoleSuggestions() — 기본 동작', () => {
  test('scanResult가 null이면 general fallback을 반환한다', () => {
    const result = resolveRoleSuggestions(null, 'code-review', BASE_MAPPINGS);
    const values = result.map((r: any) => r.value);
    expect(values).toContain('소프트웨어 엔지니어');
  });

  test('반환값은 { value, label } 형태의 SelectOption 배열이다', () => {
    const result = resolveRoleSuggestions(null, 'default', BASE_MAPPINGS);
    expect(result[0]).toHaveProperty('value');
    expect(result[0]).toHaveProperty('label');
    expect(result[0].value).toBe(result[0].label);
  });
});

// ─── 프레임워크 우선순위 ─────────────────────────────────────────────

describe('resolveRoleSuggestions() — 프레임워크 역할', () => {
  test('감지된 프레임워크의 역할이 최우선으로 포함된다', () => {
    const scan = makeScan({
      frameworks: [{ name: 'React' }],
      domainContext: { primary: 'web', confidence: 'high' },
    });
    const result = resolveRoleSuggestions(scan, 'default', BASE_MAPPINGS);
    const values = result.map((r: any) => r.value);
    expect(values[0]).toBe('React 개발자');
  });

  test('프레임워크 역할은 최대 2개까지만 추가된다', () => {
    const scan = makeScan({
      frameworks: [{ name: 'React' }, { name: 'Express' }, { name: 'Unknown' }],
      domainContext: { primary: 'web', confidence: 'high' },
    });
    const result = resolveRoleSuggestions(scan, 'default', BASE_MAPPINGS);
    const values = result.map((r: any) => r.value);
    expect(values).toContain('React 개발자');
    expect(values).toContain('Node.js 백엔드 개발자');
  });

  test('존재하지 않는 프레임워크는 무시된다', () => {
    const scan = makeScan({
      frameworks: [{ name: 'Angular' }],
      domainContext: { primary: 'web', confidence: 'high' },
    });
    const result = resolveRoleSuggestions(scan, 'default', BASE_MAPPINGS);
    const values = result.map((r: any) => r.value);
    expect(values).not.toContain('Angular 개발자');
  });
});

// ─── 언어 기반 역할 ──────────────────────────────────────────────────

describe('resolveRoleSuggestions() — 언어 역할 (low confidence)', () => {
  test('confidence=low일 때 primary 언어 역할이 추가된다', () => {
    const scan = makeScan({
      languages: [{ name: 'TypeScript', role: 'primary' }],
      domainContext: { primary: 'web', confidence: 'low' },
    });
    const result = resolveRoleSuggestions(scan, 'default', BASE_MAPPINGS);
    const values = result.map((r: any) => r.value);
    expect(values).toContain('TypeScript 개발자');
  });

  test('general 도메인일 때도 언어 역할이 추가된다', () => {
    const scan = makeScan({
      languages: [{ name: 'Python', role: 'primary' }],
      domainContext: { primary: 'general', confidence: 'high' },
    });
    const result = resolveRoleSuggestions(scan, 'default', BASE_MAPPINGS);
    const values = result.map((r: any) => r.value);
    expect(values).toContain('Python 개발자');
  });
});

// ─── 중복 제거 ───────────────────────────────────────────────────────

describe('resolveRoleSuggestions() — 중복 제거', () => {
  test('동일한 역할이 여러 경로에서 나와도 한 번만 포함된다', () => {
    // domainRoles의 default와 treeRoles에 같은 항목
    const mappings = {
      domainRoles: {
        general: {
          default: ['소프트웨어 엔지니어'],
          'code-review': ['소프트웨어 엔지니어'],
        },
      },
      frameworkRoles: {},
    };
    const result = resolveRoleSuggestions(null, 'code-review', mappings);
    const values = result.map((r: any) => r.value);
    expect(values.filter((v: string) => v === '소프트웨어 엔지니어')).toHaveLength(1);
  });
});

// ─── general fallback ────────────────────────────────────────────────

describe('resolveRoleSuggestions() — general fallback', () => {
  test('도메인 역할이 3개 미만이면 general 역할로 보충한다', () => {
    const mappings = {
      domainRoles: {
        general: {
          default: ['소프트웨어 엔지니어', '풀스택 개발자', '백엔드 엔지니어'],
        },
        sparse: {
          default: ['희소 역할'],
        },
      },
      frameworkRoles: {},
    };
    const scan = makeScan({ domainContext: { primary: 'sparse', confidence: 'high' } });
    const result = resolveRoleSuggestions(scan, 'default', mappings);
    const values = result.map((r: any) => r.value);
    expect(values.length).toBeGreaterThanOrEqual(2);
    expect(values).toContain('소프트웨어 엔지니어');
  });
});
