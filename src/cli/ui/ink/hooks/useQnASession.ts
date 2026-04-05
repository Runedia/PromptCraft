import React from 'react';
import { destroySession, getCurrentQuestion, submitAnswer } from '../../../../core/qna/engine.js';
import { startSession } from '../../../../core/qna/index.js';
import type { QnAAnswers, QnAQuestion, QnASubmitResult, ScanResult } from '../../../../core/types.js';

interface UseQnASessionOptions {
  sessionId: string;
  treeId: string;
  onSessionReset?: (newSessionId: string) => void;
  sessionOptions?: { scanResult?: ScanResult | null };
}

interface HistoryEntry {
  question: string;
  answer: string;
}

interface UndoEntry {
  questionText: string;
  key: string | undefined;
  answer: string;
}

interface SubmitResult {
  success: boolean;
  error?: string;
}

function useQnASession({
  sessionId,
  treeId,
  onSessionReset,
  sessionOptions,
}: UseQnASessionOptions) {
  // sessionId를 ref로도 유지해 stale closure 방지
  const sessionIdRef = React.useRef(sessionId);
  React.useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  // sessionId가 실제 세션으로 변경될 때 첫 질문을 로드
  // (초기 렌더 시 placeholder로 호출되어 question=null인 경우 대응)
  React.useEffect(() => {
    if (!sessionId || sessionId === '__placeholder__') return;
    try {
      const q = getCurrentQuestion(sessionId);
      setQuestion(q);
    } catch {
      setQuestion(null);
    }
  }, [sessionId]);

  const [question, setQuestion] = React.useState<QnAQuestion | null>(() => {
    try {
      return getCurrentQuestion(sessionId);
    } catch {
      return null;
    }
  });
  const [completed, setCompleted] = React.useState(false);
  const [answers, setAnswers] = React.useState<QnAAnswers>({});
  const [history, setHistory] = React.useState<HistoryEntry[]>([]);
  const [submitError, setSubmitError] = React.useState('');
  // undoStack: [{ questionText, key, answer }]
  const [undoStack, setUndoStack] = React.useState<UndoEntry[]>([]);
  const [inputSeed, setInputSeed] = React.useState(0);
  const [prefill, setPrefill] = React.useState<{ key: string | null; value: string }>({
    key: null,
    value: '',
  });

  // question을 ref로 유지 (submit 콜백의 stale closure 방지)
  const questionRef = React.useRef(question);
  React.useEffect(() => {
    questionRef.current = question;
  }, [question]);

  const submit = React.useCallback((value: string): SubmitResult => {
    const sid = sessionIdRef.current;
    const currentQuestion = questionRef.current;
    let result: QnASubmitResult;
    try {
      result = submitAnswer(sid, value);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSubmitError(msg);
      return { success: false, error: msg };
    }

    if (!result.success) {
      setSubmitError(result.error || '입력 오류');
      return { success: false, error: result.error };
    }

    setSubmitError('');
    setHistory((h) => [...h, { question: currentQuestion?.question || '', answer: value }]);
    setAnswers((a) => ({ ...a, [currentQuestion?.key]: value }));
    setUndoStack((s) => [
      ...s,
      {
        questionText: currentQuestion?.question || '',
        key: currentQuestion?.key,
        answer: value,
      },
    ]);
    setPrefill({ key: null, value: '' });

    if (result.completed) {
      setCompleted(true);
      setQuestion(null);
    } else {
      try {
        setQuestion(getCurrentQuestion(sid));
      } catch {
        setCompleted(true);
        setQuestion(null);
      }
    }
    return { success: true };
  }, []);

  const undo = React.useCallback(() => {
    setUndoStack((currentStack) => {
      if (currentStack.length === 0) return currentStack;

      const sid = sessionIdRef.current;

      // 1. 현재 세션 파기
      try {
        destroySession(sid);
      } catch (_) {}

      // 2. 새 세션 생성
      const { session: newSession } = startSession(treeId, sessionOptions || {});
      const newSid = newSession.sessionId;

      // 3. 마지막 항목 제외하고 동기 replay
      const remaining = currentStack.slice(0, -1);
      remaining.forEach((item) => {
        try {
          submitAnswer(newSid, item.answer);
        } catch (_) {}
      });

      // 4. 현재 질문 갱신
      let nextQuestion = null;
      try {
        nextQuestion = getCurrentQuestion(newSid);
      } catch (_) {}

      // 5. 제거된 항목의 key
      const removedItem = currentStack[currentStack.length - 1];
      const removedKey = removedItem.key;

      // 6. 로컬 상태 갱신
      setHistory((h) => h.slice(0, -1));
      setAnswers((a) => {
        const next = { ...a };
        delete next[removedKey];
        return next;
      });
      setQuestion(nextQuestion);
      setCompleted(false);
      setSubmitError('');
      setInputSeed((seed) => seed + 1);
      setPrefill({
        key: removedKey || null,
        value: typeof removedItem.answer === 'string' ? removedItem.answer : '',
      });

      // 7. 부모에 새 sessionId 전달 (비동기로 처리해 렌더 사이클 밖으로)
      if (onSessionReset) {
        Promise.resolve().then(() => onSessionReset(newSid));
      }

      return remaining;
    });
  }, [treeId, onSessionReset, sessionOptions]);

  return {
    question,
    completed,
    answers,
    history,
    submit,
    submitError,
    undo,
    undoStack,
    inputSeed,
    prefill,
  };
}

export { useQnASession };
