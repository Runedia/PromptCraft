import { describe, expect, test } from 'bun:test';
import { resolveRoleSuggestions } from '../../../src/core/builder/role-resolver.js';
import type { SelectOption } from '../../../src/core/types/card.js';
import type { ScanResult } from '../../../src/core/types.js';

const BASE_SCAN: ScanResult = {
  path: '/tmp/fixture',
  languages: [],
  frameworks: [],
  structure: { name: 'root', children: [] },
  packageManager: null,
  hasEnv: false,
  configFiles: [],
  ignoreSource: 'gitignore',
  scannedAt: '2026-04-21T00:00:00.000Z',
  domainContext: { primary: 'general', secondary: null, confidence: 'medium' },
} as unknown as ScanResult;

function makeScan(overrides: Partial<ScanResult> = {}): ScanResult {
  return { ...BASE_SCAN, ...overrides };
}

const BASE_MAPPINGS = {
  domainRoles: {
    general: {
      default: ['소프트웨어 엔지니어', '풀스택 개발자', '백엔드 엔지니어'],
      'code-review': ['시니어 개발자', '코드 리뷰어'],
    },
    'web-frontend': {
      default: ['프론트엔드 개발자', 'UI/UX 엔지니어'],
      'error-solving': ['프론트엔드 디버깅 전문가', '브라우저 호환성 엔지니어'],
      'code-review': ['시니어 프론트엔드 개발자', '접근성(a11y) 전문가'],
      refactoring: ['프론트엔드 리팩토링 전문가', 'UI 컴포넌트 아키텍트'],
    },
    systems: {
      default: ['시스템 프로그래머', '성능 엔지니어', '백엔드 엔지니어'],
      'error-solving': ['시스템 디버깅 전문가', '성능 최적화 엔지니어'],
      'code-review': ['시니어 시스템 엔지니어', '메모리 안전성 전문가'],
      refactoring: ['시스템 리팩토링 전문가', '메모리 안전성 전문가'],
    },
  },
  frameworkRoles: {
    React: 'React 컴포넌트 아키텍트',
    Express: 'Node.js API 엔지니어',
  },
  languageRoles: {
    TypeScript: 'TypeScript 개발자',
    Python: 'Python 개발자',
  },
};

// ─── 기본 동작 ───────────────────────────────────────────────────────

describe('resolveRoleSuggestions() — 기본 동작', () => {
  test('scanResult가 null이면 general 도메인의 default 역할이 base로 노출된다', () => {
    const result = resolveRoleSuggestions(null, 'code-review', BASE_MAPPINGS);
    const values = result.map((r: SelectOption) => r.value);
    expect(values.slice(0, 2)).toEqual(['소프트웨어 엔지니어', '풀스택 개발자']);
  });

  test('반환값은 { value, label } 형태의 SelectOption 배열이다', () => {
    const result = resolveRoleSuggestions(null, 'default', BASE_MAPPINGS);
    expect(result[0]).toHaveProperty('value');
    expect(result[0]).toHaveProperty('label');
    expect(result[0].value).toBe(result[0].label);
  });
});

// ─── base prepend 정책 ───────────────────────────────────────────────

describe('resolveRoleSuggestions() — base 역할 prepend', () => {
  test('base 2개가 슬롯 1~2에 항상 prepend된다', () => {
    const scan = makeScan({
      frameworks: [{ name: 'React', version: null, source: 'package.json' }],
      domainContext: { primary: 'web-frontend', secondary: null, confidence: 'high' },
    });
    const result = resolveRoleSuggestions(scan, 'error-solving', BASE_MAPPINGS);
    const values = result.map((r: SelectOption) => r.value);
    expect(values.slice(0, 2)).toEqual(['프론트엔드 개발자', 'UI/UX 엔지니어']);
  });

  test('framework 정제 역할은 base 다음(3번 슬롯)에 위치', () => {
    const scan = makeScan({
      frameworks: [{ name: 'React', version: null, source: 'package.json' }],
      domainContext: { primary: 'web-frontend', secondary: null, confidence: 'high' },
    });
    const result = resolveRoleSuggestions(scan, 'error-solving', BASE_MAPPINGS);
    const values = result.map((r: SelectOption) => r.value);
    expect(values[2]).toBe('React 컴포넌트 아키텍트');
  });

  test('tree-spec 역할은 framework 다음(4번 슬롯) 이후', () => {
    const scan = makeScan({
      frameworks: [{ name: 'React', version: null, source: 'package.json' }],
      domainContext: { primary: 'web-frontend', secondary: null, confidence: 'high' },
    });
    const result = resolveRoleSuggestions(scan, 'error-solving', BASE_MAPPINGS);
    const values = result.map((r: SelectOption) => r.value);
    expect(values[3]).toBe('프론트엔드 디버깅 전문가');
  });
});

// ─── 메인-워크스페이스 일치 ──────────────────────────────────────────

describe('resolveRoleSuggestions() — 메인-워크스페이스 일치', () => {
  test('roleSuffix 포함 시 트리×조합 역할이 1번 슬롯, base는 그 뒤로 밀려도 양쪽에 등장', () => {
    const scan = makeScan({
      languages: [{ name: 'TypeScript', extension: '.ts', count: 10, percentage: 100, role: 'primary' }],
      frameworks: [{ name: 'React', version: null, source: 'package.json' }],
      domainContext: { primary: 'web-frontend', secondary: null, confidence: 'high' },
    });
    const main = resolveRoleSuggestions(scan, 'refactoring', BASE_MAPPINGS).map((r) => r.value);
    const workspace = resolveRoleSuggestions(scan, 'refactoring', BASE_MAPPINGS, '리팩토링 전문가').map((r) => r.value);

    expect(workspace[0]).toBe('React 리팩토링 전문가');
    expect(main.slice(0, 2)).toEqual(['프론트엔드 개발자', 'UI/UX 엔지니어']);
    expect(workspace).toContain('프론트엔드 개발자');
    expect(workspace).toContain('UI/UX 엔지니어');
  });
});

// ─── 트리간 통일성 ───────────────────────────────────────────────────

describe('resolveRoleSuggestions() — 트리간 base 공통', () => {
  test('동일 도메인의 모든 트리에서 base 2개가 슬롯 1~2 공통', () => {
    const scan = makeScan({
      domainContext: { primary: 'systems', secondary: null, confidence: 'high' },
    });
    const trees = ['error-solving', 'code-review', 'refactoring'] as const;
    for (const t of trees) {
      const values = resolveRoleSuggestions(scan, t, BASE_MAPPINGS).map((r) => r.value);
      expect(values.slice(0, 2)).toEqual(['시스템 프로그래머', '성능 엔지니어']);
    }
  });

  test('트리별 차별화는 tree-spec 슬롯에서 발생 (트리간 다름)', () => {
    const scan = makeScan({
      domainContext: { primary: 'systems', secondary: null, confidence: 'high' },
    });
    const errorSolving = resolveRoleSuggestions(scan, 'error-solving', BASE_MAPPINGS).map((r) => r.value);
    const codeReview = resolveRoleSuggestions(scan, 'code-review', BASE_MAPPINGS).map((r) => r.value);
    expect(errorSolving).toContain('시스템 디버깅 전문가');
    expect(codeReview).toContain('시니어 시스템 엔지니어');
    expect(errorSolving).not.toContain('시니어 시스템 엔지니어');
  });
});

// ─── 언어 기반 역할 ──────────────────────────────────────────────────

describe('resolveRoleSuggestions() — 언어 역할 (low confidence)', () => {
  test('confidence=low일 때 primary 언어 역할이 추가된다', () => {
    const scan = makeScan({
      languages: [{ name: 'TypeScript', extension: '.ts', count: 1, percentage: 100, role: 'primary' }],
      domainContext: { primary: 'web-frontend', secondary: null, confidence: 'low' },
    });
    const result = resolveRoleSuggestions(scan, 'default', BASE_MAPPINGS);
    const values = result.map((r: SelectOption) => r.value);
    expect(values).toContain('TypeScript 개발자');
  });

  test('general 도메인일 때도 언어 역할이 추가된다', () => {
    const scan = makeScan({
      languages: [{ name: 'Python', extension: '.py', count: 1, percentage: 100, role: 'primary' }],
      domainContext: { primary: 'general', secondary: null, confidence: 'high' },
    });
    const result = resolveRoleSuggestions(scan, 'default', BASE_MAPPINGS);
    const values = result.map((r: SelectOption) => r.value);
    expect(values).toContain('Python 개발자');
  });
});

// ─── 중복 제거 ───────────────────────────────────────────────────────

describe('resolveRoleSuggestions() — 중복 제거', () => {
  test('동일한 역할이 여러 경로에서 나와도 한 번만 포함된다', () => {
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
    const values = result.map((r: SelectOption) => r.value);
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
        game: {
          default: ['희소 역할'],
        },
      },
      frameworkRoles: {},
    };
    const scan = makeScan({ domainContext: { primary: 'game', secondary: null, confidence: 'high' } });
    const result = resolveRoleSuggestions(scan, 'default', mappings);
    const values = result.map((r: SelectOption) => r.value);
    expect(values.length).toBeGreaterThanOrEqual(2);
    expect(values).toContain('소프트웨어 엔지니어');
  });
});

// ─── default treeId 처리 ─────────────────────────────────────────────

describe('resolveRoleSuggestions() — default treeId', () => {
  test('treeId="default"는 tree-spec 없이 base만 노출', () => {
    const scan = makeScan({
      domainContext: { primary: 'systems', secondary: null, confidence: 'high' },
    });
    const result = resolveRoleSuggestions(scan, 'default', BASE_MAPPINGS);
    const values = result.map((r: SelectOption) => r.value);
    expect(values.slice(0, 2)).toEqual(['시스템 프로그래머', '성능 엔지니어']);
    expect(values).not.toContain('시스템 디버깅 전문가');
    expect(values).not.toContain('시니어 시스템 엔지니어');
  });
});
