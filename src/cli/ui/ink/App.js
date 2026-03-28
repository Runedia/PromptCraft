'use strict';

const React = require('react');
const { useQnASession }  = require('./hooks/useQnASession');
const Header             = require('./components/Header');
const ProgressList       = require('./components/ProgressList');
const QuestionBox        = require('./components/QuestionBox');
const StatusBar          = require('./components/StatusBar');

// Q&A 트리의 총 노드 수를 미리 계산하기 위한 헬퍼
// 대략적인 추정값 (정확하지 않아도 됨)
function estimateTotalSteps(treeId) {
  const STEP_COUNTS = {
    'error-solving': 6,
    'feature-impl':  5,
    'code-review':   5,
    'concept-learn': 5,
  };
  return STEP_COUNTS[treeId] || 5;
}

function App({ treeId, sessionId, projectRoot, templateAnswers, onComplete, onCancel, inkComponents }) {
  const { Box, Text, useInput, useApp } = inkComponents;
  const { exit } = useApp();

  const {
    question, completed, answers, history, submit, submitError,
  } = useQnASession(sessionId);

  const totalSteps = estimateTotalSteps(treeId);
  const stepNum    = history.length + 1;

  // 완료 감지
  React.useEffect(() => {
    if (completed) {
      onComplete(answers);
    }
  }, [completed]);

  // 템플릿 답변 자동 제출
  React.useEffect(() => {
    if (!question || !templateAnswers) return;
    const val = templateAnswers[question.key];
    if (val !== undefined) {
      submit(val);
    }
  }, [question?.key]);

  // Ctrl+C 전역 처리
  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      exit();
      onCancel();
    }
  });

  if (completed) {
    return React.createElement(Box, { padding: 1 },
      React.createElement(Text, { color: 'green', bold: true }, '  ✓ 완료! 프롬프트를 생성합니다...')
    );
  }

  return React.createElement(Box, {
    flexDirection: 'column',
    borderStyle: 'round',
    borderColor: 'cyan',
    paddingX: 1,
    paddingY: 0,
  },
    React.createElement(Header, { treeId, inkComponents }),
    React.createElement(ProgressList, { history, inkComponents }),
    question
      ? React.createElement(QuestionBox, {
          key: question.nodeId,
          question,
          projectRoot,
          submit,
          submitError,
          stepNum,
          totalSteps,
          inkComponents,
        })
      : null,
    React.createElement(StatusBar, { question, inkComponents })
  );
}

module.exports = App;
