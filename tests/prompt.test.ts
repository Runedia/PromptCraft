const {
  buildFromAnswers,
  getAvailableTemplates,
  estimateTokenCount,
} = require('../src/core/prompt');

const mockScanResult = {
  path: '/test/project',
  languages: [
    { name: 'JavaScript', count: 40, percentage: 62.5 },
    { name: 'TypeScript', count: 24, percentage: 37.5 },
  ],
  frameworks: [{ name: 'Express', version: '4.18.2' }],
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
  test('error-solving network 분기 프롬프트 생성', () => {
    const result = buildFromAnswers(
      'error-solving',
      {
        role: '시니어 JavaScript 개발자',
        goal: '네트워크 에러 해결',
        currentSituation: '결제 API 호출 실패',
        errorType: 'network',
        requestLog: 'POST /pay 502',
        constraints: '',
      },
      mockScanResult
    );
    expect(typeof result).toBe('string');
    expect(result).toContain('요청/응답 스니펫');
  });

  test('feature-impl new 분기 프롬프트 생성', () => {
    const result = buildFromAnswers(
      'feature-impl',
      {
        role: '개발자',
        goal: '신규 기능 구현',
        implScope: 'new',
        techPreference: 'Clean Architecture',
        constraints: '',
      },
      mockScanResult
    );
    expect(result).toContain('신규 구현');
    expect(result).toContain('선호 기술/패턴');
  });
});

describe('상황별 템플릿 선택', () => {
  test('getAvailableTemplates가 배열을 반환한다', () => {
    const templates = getAvailableTemplates();
    expect(Array.isArray(templates)).toBe(true);
    expect(templates).toContain('error-solving');
    expect(templates).toContain('feature-impl');
    expect(templates).toContain('code-review');
    expect(templates).toContain('concept-learn');
    expect(templates).not.toContain('default');
  });
});

describe('scanResult null 처리 및 토큰 계산', () => {
  test('scanResult null이어도 buildFromAnswers가 동작한다', () => {
    const result = buildFromAnswers(
      'feature-impl',
      {
        role: '개발자',
        goal: '사용자 인증 기능 구현',
        implScope: 'new',
        constraints: '',
      },
      null
    );
    expect(result).toContain('스캔 정보 없음');
  });

  test('estimateTokenCount 동작', () => {
    expect(estimateTokenCount('abcd')).toBe(1);
    expect(estimateTokenCount('abcde')).toBe(2);
    expect(estimateTokenCount('')).toBe(0);
    expect(estimateTokenCount(null)).toBe(0);
  });
});
