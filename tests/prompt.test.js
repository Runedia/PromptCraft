'use strict';

const { buildPrompt } = require('../src/core/prompt');

const mockScanResult = {
  path: '/test/project',
  languages: [
    { name: 'JavaScript', count: 40, percentage: 62.5 },
    { name: 'TypeScript', count: 24, percentage: 37.5 },
  ],
  frameworks: [
    { name: 'Express', version: '4.18.2' },
    { name: 'React', version: '18.2.0' },
  ],
  structure: {
    name: 'root',
    children: [
      { name: 'src', children: [{ name: 'index.js', children: [] }] },
      { name: 'tests', children: [] },
    ],
  },
  packageManager: 'npm',
  hasEnv: false,
  configFiles: ['package.json'],
  scannedAt: new Date().toISOString(),
};

describe('buildPrompt — error-solving 새 섹션 포맷', () => {
  const answers = {
    role: '시니어 JavaScript 개발자',
    goal: '배열 순회 에러 해결',
    currentSituation: 'data.map 호출 시 undefined 에러 발생',
    errorEvidence: "TypeError: Cannot read properties of undefined (reading 'map')",
    triedMethods: 'console.log으로 변수 확인, undefined 체크 추가',
    constraints: '',
  };

  test('Role 섹션이 렌더링된다', () => {
    const result = buildPrompt('error-solving', answers, mockScanResult);
    expect(result).toContain('역할 (Role)');
    expect(result).toContain('시니어 JavaScript 개발자');
  });

  test('프로젝트 환경 섹션이 렌더링된다', () => {
    const result = buildPrompt('error-solving', answers, mockScanResult);
    expect(result).toContain('프로젝트 환경 (Context & Environment)');
  });

  test('Goal 섹션이 렌더링된다', () => {
    const result = buildPrompt('error-solving', answers, mockScanResult);
    expect(result).toContain('목표 (Goal)');
    expect(result).toContain('배열 순회 에러 해결');
  });

  test('Current Situation 섹션이 렌더링된다', () => {
    const result = buildPrompt('error-solving', answers, mockScanResult);
    expect(result).toContain('상황 설명 (Context)');
    expect(result).toContain('data.map 호출 시 undefined 에러 발생');
  });

  test('Error / Evidence 섹션이 렌더링된다', () => {
    const result = buildPrompt('error-solving', answers, mockScanResult);
    expect(result).toContain('오류 내용 및 증거 (Error Log)');
    expect(result).toContain("TypeError: Cannot read properties of undefined (reading 'map')");
  });

  test('Constraints 섹션이 렌더링된다', () => {
    const result = buildPrompt('error-solving', answers, mockScanResult);
    expect(result).toContain('제약 조건 (Constraints)');
  });

  test('프레임워크 목록이 major.x 형식으로 렌더링된다', () => {
    const result = buildPrompt('error-solving', answers, mockScanResult);
    expect(result).toContain('Express 4.x');
    expect(result).toContain('React 18.x');
  });

  test('언어 목록이 올바른 형식으로 렌더링된다', () => {
    const result = buildPrompt('error-solving', answers, mockScanResult);
    expect(result).toContain('JavaScript(63%)');
    expect(result).toContain('TypeScript(38%)');
  });
});

describe('buildPrompt — scanResult null', () => {
  const answers = {
    role: 'Go 개발자',
    goal: '컴파일 에러 해결',
    currentSituation: '빌드 실패',
    errorEvidence: 'undefined: someFunc',
    triedMethods: '패키지 확인',
    constraints: '',
  };

  test('scanResult가 null이면 스캔 정보 없음이 표시된다', () => {
    const result = buildPrompt('error-solving', answers, null);
    expect(result).toContain('스캔 정보 없음');
  });
});

describe('buildPrompt — keyPaths helper', () => {
  const answers = {
    role: '개발자',
    goal: '경로 표시 확인',
    currentSituation: '상황',
    errorEvidence: '에러',
    constraints: '',
  };

  test('구조 children에 문자열이 섞여도 Key Paths에 undefined가 포함되지 않는다', () => {
    const result = buildPrompt('error-solving', answers, {
      languages: [{ name: 'JavaScript', percentage: 100 }],
      frameworks: [],
      structure: {
        name: 'root',
        children: ['README.md', { name: 'src', children: [] }, { name: 'tests', children: [] }],
      },
    });
    expect(result).not.toContain('undefined');
    expect(result).toContain('/src');
    expect(result).toContain('/tests');
  });
});

describe('buildPrompt — 존재하지 않는 treeId 폴백', () => {
  const answers = {
    role: '주니어 개발자',
    goal: '알 수 없는 문제가 발생했습니다.',
  };

  test('없는 treeId는 prompt-default.hbs로 폴백 렌더링된다', () => {
    const result = buildPrompt('unknown-tree-id', answers, null);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  test('폴백 결과에 답변 내용이 포함된다', () => {
    const result = buildPrompt('unknown-tree-id', answers, null);
    expect(result).toContain('알 수 없는 문제가 발생했습니다.');
  });
});
