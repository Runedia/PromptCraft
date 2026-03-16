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

describe('buildPrompt — error-solving', () => {
  const answers = {
    language: 'JavaScript',
    errorMessage: "TypeError: Cannot read properties of undefined (reading 'map')",
    triedMethods: 'console.log으로 변수 확인, undefined 체크 추가',
    expectedBehavior: '배열을 정상적으로 순회해야 함',
    codeSnippet: 'const result = data.map(x => x.id);',
  };

  test('에러 메시지가 렌더링 결과에 포함된다', () => {
    const result = buildPrompt('error-solving', answers, mockScanResult);
    expect(result).toContain("TypeError: Cannot read properties of undefined (reading 'map')");
  });

  test('프로젝트 컨텍스트 섹션이 렌더링된다', () => {
    const result = buildPrompt('error-solving', answers, mockScanResult);
    expect(result).toContain('프로젝트 컨텍스트');
    expect(result).toContain('JavaScript');
  });

  test('codeSnippet이 코드 블록으로 렌더링된다', () => {
    const result = buildPrompt('error-solving', answers, mockScanResult);
    expect(result).toContain('```');
    expect(result).toContain("data.map(x => x.id)");
  });
});

describe('buildPrompt — 선택 필드 없는 최소 answers', () => {
  const minimalAnswers = {
    language: 'Python',
    errorMessage: 'NameError: name x is not defined',
    triedMethods: '없음',
    expectedBehavior: '정상 실행',
  };

  test('선택 필드(codeSnippet) 없으면 해당 섹션이 출력되지 않는다', () => {
    const result = buildPrompt('error-solving', minimalAnswers, null);
    // codeSnippet 없으면 관련 코드 섹션이 없어야 함
    expect(result).not.toContain('관련 코드\n\n```');
  });
});

describe('buildPrompt — scanResult null', () => {
  const answers = {
    language: 'Go',
    errorMessage: 'undefined: someFunc',
    triedMethods: '패키지 확인',
    expectedBehavior: '컴파일 성공',
  };

  test('scanResult가 null이면 프로젝트 컨텍스트 섹션이 출력되지 않는다', () => {
    const result = buildPrompt('error-solving', answers, null);
    expect(result).not.toContain('프로젝트 컨텍스트');
  });
});

describe('buildPrompt — 존재하지 않는 treeId 폴백', () => {
  const answers = {
    problemDescription: '알 수 없는 문제가 발생했습니다.',
  };

  test('없는 treeId는 prompt-default.hbs로 폴백 렌더링된다', () => {
    const result = buildPrompt('unknown-tree-id', answers, null);
    // 기본 템플릿이 렌더링되어야 함 (빈 문자열이 아님)
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  test('폴백 결과에 problemDescription이 포함된다', () => {
    const result = buildPrompt('unknown-tree-id', answers, null);
    expect(result).toContain('알 수 없는 문제가 발생했습니다.');
  });
});

describe('helpers — languageList & frameworkList', () => {
  test('언어 목록이 올바른 형식으로 렌더링된다', () => {
    const result = buildPrompt('error-solving', {
      language: 'JS',
      errorMessage: 'err',
      triedMethods: 'none',
      expectedBehavior: 'ok',
    }, mockScanResult);
    expect(result).toContain('JavaScript(63%)');
    expect(result).toContain('TypeScript(38%)');
  });

  test('프레임워크 목록이 major.x 형식으로 렌더링된다', () => {
    const result = buildPrompt('error-solving', {
      language: 'JS',
      errorMessage: 'err',
      triedMethods: 'none',
      expectedBehavior: 'ok',
    }, mockScanResult);
    expect(result).toContain('Express 4.x');
    expect(result).toContain('React 18.x');
  });
});
