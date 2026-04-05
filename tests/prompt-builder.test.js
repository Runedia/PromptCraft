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

describe('buildPrompt — error-solving 분기 포맷', () => {
  test('runtime 분기에서는 런타임 에러 블록이 나온다', () => {
    const result = buildPrompt('error-solving', {
      role: '시니어 개발자',
      goal: '런타임 오류 해결',
      currentSituation: '상황',
      errorType: 'runtime',
      errorEvidence: 'TypeError...',
      constraints: '',
    }, mockScanResult);

    expect(result).toContain('에러 로그 (Runtime Error)');
    expect(result).toContain('TypeError...');
  });

  test('build 분기에서는 빌드 로그 블록이 나온다', () => {
    const result = buildPrompt('error-solving', {
      role: '시니어 개발자',
      goal: '빌드 오류 해결',
      currentSituation: '상황',
      errorType: 'build',
      buildLog: 'TS2345...',
      constraints: '',
    }, mockScanResult);

    expect(result).toContain('빌드 에러 로그');
    expect(result).toContain('TS2345...');
  });
});

describe('buildPrompt — feature/concept/code-review 변경 반영', () => {
  test('feature-impl modify 분기 출력', () => {
    const result = buildPrompt('feature-impl', {
      role: '개발자',
      goal: '기능 개선',
      implScope: 'modify',
      targetCode: 'function x() {}',
      modificationScope: 'API 응답 형식 유지',
      constraints: '',
    }, mockScanResult);

    expect(result).toContain('수정 대상 코드');
    expect(result).toContain('API 응답 형식 유지');
  });

  test('code-review securityContext 출력', () => {
    const result = buildPrompt('code-review', {
      role: '보안 엔지니어',
      goal: '보안 점검',
      reviewFocus: 'security',
      reviewCode: 'const x = 1;',
      securityContext: '외부 공개 API',
      constraints: '',
    }, mockScanResult);

    expect(result).toContain('보안 맥락');
    expect(result).toContain('외부 공개 API');
  });

  test('concept-learn outputPref별 안내 출력', () => {
    const result = buildPrompt('concept-learn', {
      role: '개발자',
      goal: '개념 학습',
      concept: '이벤트 루프',
      skillLevel: 'beginner',
      outputPref: 'code-first',
      constraints: '',
    }, mockScanResult);

    expect(result).toContain('실행 가능한 예제 코드 (Working Code First)');
  });
});
