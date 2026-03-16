'use strict';

const { buildFromAnswers, getAvailableTemplates, estimateTokenCount } = require('../src/core/prompt');

const mockScanResult = {
  path: '/test/project',
  languages: [
    { name: 'JavaScript', count: 40, percentage: 62.5 },
    { name: 'TypeScript', count: 24, percentage: 37.5 },
  ],
  frameworks: [
    { name: 'Express', version: '4.18.2' },
  ],
  structure: {
    name: 'root',
    children: [{ name: 'src', children: [] }],
  },
  packageManager: 'npm',
  hasEnv: false,
  configFiles: ['package.json'],
  scannedAt: new Date().toISOString(),
};

describe('전체 빌드 시나리오', () => {
  const answers = {
    language: 'JavaScript',
    errorMessage: "TypeError: Cannot read properties of undefined (reading 'map')",
    triedMethods: 'console.log으로 변수 확인',
    expectedBehavior: '배열을 정상적으로 순회해야 함',
    codeSnippet: 'const result = data.map(x => x.id);',
  };

  test('buildFromAnswers가 비어있지 않은 문자열을 반환한다', () => {
    const result = buildFromAnswers('error-solving', answers, mockScanResult);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  test('에러 메시지가 렌더링 결과에 포함된다', () => {
    const result = buildFromAnswers('error-solving', answers, mockScanResult);
    expect(result).toContain("TypeError: Cannot read properties of undefined (reading 'map')");
  });

  test('프로젝트 컨텍스트 섹션이 렌더링된다', () => {
    const result = buildFromAnswers('error-solving', answers, mockScanResult);
    expect(result).toContain('프로젝트 컨텍스트');
    expect(result).toContain('JavaScript');
  });
});

describe('상황별 템플릿 선택', () => {
  test('getAvailableTemplates가 배열을 반환한다', () => {
    const templates = getAvailableTemplates();
    expect(Array.isArray(templates)).toBe(true);
  });

  test('4개의 treeId가 포함된다', () => {
    const templates = getAvailableTemplates();
    expect(templates).toContain('error-solving');
    expect(templates).toContain('feature-impl');
    expect(templates).toContain('code-review');
    expect(templates).toContain('concept-learn');
  });

  test('default는 목록에 포함되지 않는다', () => {
    const templates = getAvailableTemplates();
    expect(templates).not.toContain('default');
  });
});

describe('scanResult null 처리', () => {
  const answers = {
    title: '새 기능 추가',
    description: '사용자 인증 기능 구현',
    acceptanceCriteria: '로그인/로그아웃 동작',
  };

  test('scanResult null이어도 buildFromAnswers가 정상 동작한다', () => {
    const result = buildFromAnswers('feature-impl', answers, null);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  test('scanResult null이면 프로젝트 컨텍스트 섹션이 없다', () => {
    const result = buildFromAnswers('feature-impl', answers, null);
    expect(result).not.toContain('프로젝트 컨텍스트');
  });
});

describe('빌드 시간 및 estimateTokenCount', () => {
  const answers = {
    language: 'JavaScript',
    errorMessage: 'ReferenceError: x is not defined',
    triedMethods: '없음',
    expectedBehavior: '정상 실행',
  };

  test('빌드가 3000ms 이내에 완료된다', () => {
    const start = Date.now();
    buildFromAnswers('error-solving', answers, mockScanResult);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(3000);
  });

  test('estimateTokenCount가 양수를 반환한다', () => {
    const result = buildFromAnswers('error-solving', answers, mockScanResult);
    const count = estimateTokenCount(result);
    expect(count).toBeGreaterThan(0);
  });

  test('estimateTokenCount가 글자 수 / 4로 계산된다', () => {
    expect(estimateTokenCount('abcd')).toBe(1);
    expect(estimateTokenCount('abcde')).toBe(2);
    expect(estimateTokenCount('')).toBe(0);
  });

  test('estimateTokenCount에 비문자열 전달 시 0을 반환한다', () => {
    expect(estimateTokenCount(null)).toBe(0);
    expect(estimateTokenCount(undefined)).toBe(0);
    expect(estimateTokenCount(42)).toBe(0);
  });
});
