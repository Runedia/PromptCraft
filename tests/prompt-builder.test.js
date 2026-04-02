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
    role: '시니어 JavaScript 개발자',
    goal: '배열 순회 에러 해결',
    currentSituation: 'data.map 호출 시 에러 발생',
    errorEvidence: "TypeError: Cannot read properties of undefined (reading 'map')",
    triedMethods: 'console.log으로 변수 확인',
    constraints: '',
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

  test('## Stack & Environment 섹션이 렌더링된다', () => {
    const result = buildFromAnswers('error-solving', answers, mockScanResult);
    expect(result).toContain('프로젝트 환경 (Context & Environment)');
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
    role: '개발자',
    goal: '사용자 인증 기능 구현',
    currentSituation: '새 프로젝트',
    constraints: '',
  };

  test('scanResult null이어도 buildFromAnswers가 정상 동작한다', () => {
    const result = buildFromAnswers('feature-impl', answers, null);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  test('scanResult null이면 스캔 정보 없음이 표시된다', () => {
    const result = buildFromAnswers('feature-impl', answers, null);
    expect(result).toContain('스캔 정보 없음');
  });

  test('currentSituation 비어도 바닥부터 새로 구현 문구가 나오지 않는다', () => {
    const result = buildFromAnswers('feature-impl', {
      role: '개발자',
      goal: '기능 구현',
      currentSituation: '',
      constraints: '',
    }, {
      languages: [{ name: 'JavaScript', percentage: 100 }],
      frameworks: [],
      structure: { name: 'root', children: [{ name: 'src', children: [] }] },
    });
    expect(result).not.toContain('바닥부터 새로 구현하십시오');
    expect(result).toContain('상세 상황이 제공되지 않았습니다');
  });
});

describe('빌드 시간 및 estimateTokenCount', () => {
  const answers = {
    role: 'Python 개발자',
    goal: 'ReferenceError 해결',
    currentSituation: '실행 시 에러 발생',
    errorEvidence: 'ReferenceError: x is not defined',
    triedMethods: '없음',
    constraints: '',
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
