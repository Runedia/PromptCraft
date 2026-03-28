'use strict';

const React = require('react');
const { getCurrentQuestion, submitAnswer } = require('../../../../core/qna/engine');

function useQnASession(sessionId) {
  const [question, setQuestion] = React.useState(() => {
    try { return getCurrentQuestion(sessionId); } catch { return null; }
  });
  const [completed, setCompleted] = React.useState(false);
  const [answers, setAnswers]     = React.useState({});
  const [history, setHistory]     = React.useState([]);
  const [submitError, setSubmitError] = React.useState('');

  const submit = React.useCallback((value) => {
    let result;
    try {
      result = submitAnswer(sessionId, value);
    } catch (err) {
      setSubmitError(err.message);
      return { success: false, error: err.message };
    }

    if (!result.success) {
      setSubmitError(result.error || '입력 오류');
      return { success: false, error: result.error };
    }

    setSubmitError('');
    setHistory(h => [...h, { question: question?.question || '', answer: value }]);
    setAnswers(a => ({ ...a, [question?.key]: value }));

    if (result.completed) {
      setCompleted(true);
      setQuestion(null);
    } else {
      try {
        setQuestion(getCurrentQuestion(sessionId));
      } catch {
        setCompleted(true);
        setQuestion(null);
      }
    }
    return { success: true };
  }, [sessionId, question]);

  return { question, completed, answers, history, submit, submitError };
}

module.exports = { useQnASession };
