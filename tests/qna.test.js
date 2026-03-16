'use strict';

const { startSession, submitAnswer, getAnswers, getCurrentQuestion } = require('../src/core/qna');

describe('QnA Engine — error-solving 전체 플로우', () => {
  test('5개 노드 순서대로 답변 후 completed: true', () => {
    const { session } = startSession('error-solving');
    const { sessionId } = session;

    expect(getCurrentQuestion(sessionId).key).toBe('language');
    expect(submitAnswer(sessionId, 'Node.js 20')).toEqual({ success: true, completed: false });

    expect(getCurrentQuestion(sessionId).key).toBe('errorMessage');
    expect(submitAnswer(sessionId, 'TypeError: Cannot read properties of undefined')).toEqual({ success: true, completed: false });

    expect(getCurrentQuestion(sessionId).key).toBe('triedMethods');
    expect(submitAnswer(sessionId, 'console.log 디버깅, 스택 오버플로우 검색')).toEqual({ success: true, completed: false });

    expect(getCurrentQuestion(sessionId).key).toBe('expectedBehavior');
    expect(submitAnswer(sessionId, '정상적으로 객체 속성에 접근')).toEqual({ success: true, completed: false });

    expect(getCurrentQuestion(sessionId).key).toBe('codeSnippet');
    expect(submitAnswer(sessionId, 'const x = obj.prop;')).toEqual({ success: true, completed: true });

    const answers = getAnswers(sessionId);
    expect(answers.language).toBe('Node.js 20');
    expect(answers.codeSnippet).toBe('const x = obj.prop;');
  });
});

describe('QnA Engine — feature-impl 분기 경로', () => {
  test('"있음" 선택 → existing-code 노드를 거침', () => {
    const { session } = startSession('feature-impl');
    const { sessionId } = session;

    submitAnswer(sessionId, '로그인 기능 구현');
    expect(getCurrentQuestion(sessionId).nodeId).toBe('has-existing-code');

    submitAnswer(sessionId, '있음');
    expect(getCurrentQuestion(sessionId).nodeId).toBe('existing-code');

    submitAnswer(sessionId, 'function login() {}');
    expect(getCurrentQuestion(sessionId).nodeId).toBe('reference-code');

    submitAnswer(sessionId, '');
    expect(getCurrentQuestion(sessionId).nodeId).toBe('constraints');

    submitAnswer(sessionId, '');
    expect(getCurrentQuestion(sessionId).nodeId).toBe('desired-result');

    const result = submitAnswer(sessionId, 'JWT 기반 인증');
    expect(result).toEqual({ success: true, completed: true });

    const answers = getAnswers(sessionId);
    expect(answers.existingCode).toBe('function login() {}');
  });

  test('"없음" 선택 → existing-code 건너뜀', () => {
    const { session } = startSession('feature-impl');
    const { sessionId } = session;

    submitAnswer(sessionId, '회원가입 기능');
    expect(getCurrentQuestion(sessionId).nodeId).toBe('has-existing-code');

    submitAnswer(sessionId, '없음');
    expect(getCurrentQuestion(sessionId).nodeId).toBe('reference-code');

    const answers_so_far = require('../src/core/qna').getSession(sessionId).answers;
    expect(answers_so_far.existingCode).toBeUndefined();
  });
});

describe('QnA Engine — 필수 입력 누락', () => {
  test('required: true 노드에 빈 문자열 → { success: false, error }', () => {
    const { session } = startSession('error-solving');
    const { sessionId } = session;

    const result = submitAnswer(sessionId, '');
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  test('required: true 노드에 공백만 입력 → { success: false, error }', () => {
    const { session } = startSession('error-solving');
    const { sessionId } = session;

    const result = submitAnswer(sessionId, '   ');
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });
});

describe('QnA Engine — select 유효성 검사', () => {
  test('options 외 값 제출 → { success: false, error }', () => {
    const { session } = startSession('feature-impl');
    const { sessionId } = session;

    submitAnswer(sessionId, '기능 설명');
    expect(getCurrentQuestion(sessionId).nodeId).toBe('has-existing-code');

    const result = submitAnswer(sessionId, '모름');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/유효하지 않은 옵션/);
  });

  test('올바른 옵션 제출 → success: true', () => {
    const { session } = startSession('feature-impl');
    const { sessionId } = session;

    submitAnswer(sessionId, '기능 설명');
    const result = submitAnswer(sessionId, '있음');
    expect(result.success).toBe(true);
  });
});
