'use strict';

const { startSession, submitAnswer, getAnswers, getCurrentQuestion } = require('../src/core/qna');
const { getSession } = require('../src/core/qna/engine');

describe('QnA Engine — error-solving 분기 플로우', () => {
  test('runtime 분기에서 errorEvidence 경로를 따른다', () => {
    const { session } = startSession('error-solving');
    const { sessionId } = session;

    submitAnswer(sessionId, '백엔드 개발자');
    submitAnswer(sessionId, '런타임 오류 해결');
    submitAnswer(sessionId, '요청 처리 중 예외 발생');
    expect(getCurrentQuestion(sessionId).key).toBe('errorType');
    submitAnswer(sessionId, 'runtime');
    expect(getCurrentQuestion(sessionId).key).toBe('errorEvidence');
  });

  test('build 분기에서 buildLog 경로를 따른다', () => {
    const { session } = startSession('error-solving');
    const { sessionId } = session;

    submitAnswer(sessionId, '백엔드 개발자');
    submitAnswer(sessionId, '빌드 오류 해결');
    submitAnswer(sessionId, 'CI에서만 실패');
    submitAnswer(sessionId, 'build');
    expect(getCurrentQuestion(sessionId).key).toBe('buildLog');
  });
});

describe('QnA Engine — feature-impl 분기', () => {
  test('new 분기는 techPreference로 이동한다', () => {
    const { session } = startSession('feature-impl');
    const { sessionId } = session;

    submitAnswer(sessionId, '프론트엔드 개발자');
    submitAnswer(sessionId, '신규 컴포넌트 구현');
    submitAnswer(sessionId, 'new');
    expect(getCurrentQuestion(sessionId).key).toBe('techPreference');
  });

  test('modify 분기는 targetCode와 modificationScope를 거친다', () => {
    const { session } = startSession('feature-impl');
    const { sessionId } = session;

    submitAnswer(sessionId, '백엔드 개발자');
    submitAnswer(sessionId, '기존 코드 수정');
    submitAnswer(sessionId, 'modify');
    expect(getCurrentQuestion(sessionId).key).toBe('targetCode');
    submitAnswer(sessionId, 'function login() {}');
    expect(getCurrentQuestion(sessionId).key).toBe('modificationScope');
  });
});

describe('QnA Engine — code-review/concept-learn 변경 키', () => {
  test('code-review security 분기에서 securityContext를 묻는다', () => {
    const { session } = startSession('code-review');
    const { sessionId } = session;

    submitAnswer(sessionId, '보안 엔지니어');
    submitAnswer(sessionId, '취약점 점검');
    submitAnswer(sessionId, 'const a = 1;');
    submitAnswer(sessionId, 'security');
    expect(getCurrentQuestion(sessionId).key).toBe('securityContext');
  });

  test('concept-learn은 outputPref를 포함한다', () => {
    const { session } = startSession('concept-learn');
    const { sessionId } = session;

    submitAnswer(sessionId, '개발자');
    submitAnswer(sessionId, '개념 학습');
    submitAnswer(sessionId, '이벤트 루프');
    expect(getCurrentQuestion(sessionId).key).toBe('skillLevel');
    submitAnswer(sessionId, 'beginner');
    expect(getCurrentQuestion(sessionId).key).toBe('outputPref');
  });
});

describe('QnA Engine — role 추천 및 select 유효성 검사', () => {
  test('scanResult를 주면 role 질문이 select-or-text와 options를 반환한다', () => {
    const { session } = startSession('error-solving', {
      scanResult: {
        frameworks: [{ name: 'Express' }],
        languages: [{ name: 'JavaScript' }],
      },
    });
    const q = getCurrentQuestion(session.sessionId);
    expect(q.inputType).toBe('select-or-text');
    expect(Array.isArray(q.options)).toBe(true);
    expect(q.options.length).toBeGreaterThan(1);
  });

  test('select 유효성 검사에서 options 외 값은 실패한다', () => {
    const { session } = startSession('concept-learn');
    const { sessionId } = session;
    submitAnswer(sessionId, '개발자');
    submitAnswer(sessionId, '학습');
    submitAnswer(sessionId, '트랜잭션');
    const result = submitAnswer(sessionId, '모름');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/유효하지 않은 옵션/);
  });

  test('select-or-text에서 직접 입력값도 허용된다', () => {
    const { session } = startSession('error-solving', {
      scanResult: { frameworks: [{ name: 'Express' }], languages: [{ name: 'JavaScript' }] },
    });
    const { sessionId } = session;
    const result = submitAnswer(sessionId, '시니어 플랫폼 엔지니어');
    expect(result.success).toBe(true);
    expect(getSession(sessionId).answers.role).toBe('시니어 플랫폼 엔지니어');
  });
});
