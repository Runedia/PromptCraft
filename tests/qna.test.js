'use strict';

const { startSession, submitAnswer, getAnswers, getCurrentQuestion, getSession } = require('../src/core/qna');

describe('QnA Engine — error-solving 전체 플로우', () => {
  test('6개 노드 순서대로 답변 후 completed: true', () => {
    const { session } = startSession('error-solving');
    const { sessionId } = session;

    expect(getCurrentQuestion(sessionId).key).toBe('role');
    expect(submitAnswer(sessionId, '시니어 Node.js 개발자')).toEqual({ success: true, completed: false });

    expect(getCurrentQuestion(sessionId).key).toBe('goal');
    expect(submitAnswer(sessionId, '미들웨어 에러 해결')).toEqual({ success: true, completed: false });

    expect(getCurrentQuestion(sessionId).key).toBe('currentSituation');
    expect(submitAnswer(sessionId, 'Express 미들웨어에서 에러 발생')).toEqual({ success: true, completed: false });

    expect(getCurrentQuestion(sessionId).key).toBe('errorEvidence');
    expect(submitAnswer(sessionId, 'TypeError: Cannot read properties of undefined')).toEqual({ success: true, completed: false });

    expect(getCurrentQuestion(sessionId).key).toBe('triedMethods');
    expect(submitAnswer(sessionId, 'console.log 디버깅, 스택 오버플로우 검색')).toEqual({ success: true, completed: false });

    expect(getCurrentQuestion(sessionId).key).toBe('constraints');
    expect(submitAnswer(sessionId, '')).toEqual({ success: true, completed: true });

    const answers = getAnswers(sessionId);
    expect(answers.role).toBe('시니어 Node.js 개발자');
    expect(answers.errorEvidence).toBe('TypeError: Cannot read properties of undefined');
  });
});

describe('QnA Engine — feature-impl 분기 경로', () => {
  test('feature-impl은 has-existing-code에서 existingCode를 직접 받는다', () => {
    const { session } = startSession('feature-impl');
    const { sessionId } = session;

    // role
    submitAnswer(sessionId, '백엔드 개발자');
    // goal
    submitAnswer(sessionId, '로그인 기능 구현');
    // current-situation (optional)
    submitAnswer(sessionId, '');

    expect(getCurrentQuestion(sessionId).nodeId).toBe('has-existing-code');

    submitAnswer(sessionId, 'function login() {}');
    expect(getCurrentQuestion(sessionId).nodeId).toBe('constraints');

    const result = submitAnswer(sessionId, '');
    expect(result).toEqual({ success: true, completed: true });

    const answers = getAnswers(sessionId);
    expect(answers.existingCode).toBe('function login() {}');
  });

  test('existingCode를 비우면 그대로 다음 질문으로 진행한다', () => {
    const { session } = startSession('feature-impl');
    const { sessionId } = session;

    // role
    submitAnswer(sessionId, '프론트엔드 개발자');
    // goal
    submitAnswer(sessionId, '회원가입 기능');
    // current-situation (optional)
    submitAnswer(sessionId, '');

    expect(getCurrentQuestion(sessionId).nodeId).toBe('has-existing-code');

    submitAnswer(sessionId, '');
    expect(getCurrentQuestion(sessionId).nodeId).toBe('constraints');

    const answers_so_far = getSession(sessionId).answers;
    expect(answers_so_far.existingCode).toBe('');
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
    const { session } = startSession('concept-learn');
    const { sessionId } = session;

    // role, goal, concept을 거쳐 skill-level(select)로 이동
    submitAnswer(sessionId, '개발자');
    submitAnswer(sessionId, '개념 학습');
    submitAnswer(sessionId, '이벤트 루프');
    expect(getCurrentQuestion(sessionId).nodeId).toBe('skill-level');

    const result = submitAnswer(sessionId, '모름');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/유효하지 않은 옵션/);
  });

  test('올바른 옵션 제출 → success: true', () => {
    const { session } = startSession('concept-learn');
    const { sessionId } = session;

    submitAnswer(sessionId, '개발자');
    submitAnswer(sessionId, '개념 학습');
    submitAnswer(sessionId, '이벤트 루프');
    const result = submitAnswer(sessionId, '완전초보');
    expect(result.success).toBe(true);
  });
});

describe('QnA Engine — multiline-mention inputType', () => {
  test('multiline-mention 타입 노드가 유효하다', () => {
    const { session } = startSession('error-solving');
    const { sessionId } = session;

    // role 답변
    submitAnswer(sessionId, '개발자');
    // goal 답변
    submitAnswer(sessionId, '에러 해결');

    // current-situation은 multiline-mention 타입
    const q = getCurrentQuestion(sessionId);
    expect(q.inputType).toBe('multiline-mention');
    expect(q.key).toBe('currentSituation');
  });
});
