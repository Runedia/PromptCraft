'use strict';

const React = require('react');
const Header       = require('../components/Header');
const ProgressList = require('../components/ProgressList');
const QuestionBox  = require('../components/QuestionBox');
const StatusBar    = require('../components/StatusBar');
const { useQnASession } = require('../hooks/useQnASession');
const { startSession, destroySession } = require('../../../../core/qna/index');
const { loadTree } = require('../../../../core/qna/engine');
const { buildPrompt } = require('../../../../core/prompt/index');

/**
 * 트리 JSON을 DFS로 분석해 최대 경로 길이(스텝 수)를 계산한다.
 */
function countSteps(treeId) {
  try {
    const treeData = loadTree(treeId);
    function dfs(nodeId, visited) {
      if (!nodeId || visited.has(nodeId)) return 0;
      const node = treeData.nodes[nodeId];
      if (!node) return 0;
      const next = new Set(visited);
      next.add(nodeId);
      if (node.branches && typeof node.branches === 'object') {
        return 1 + Math.max(...Object.values(node.branches).map((nextId) => dfs(nextId, new Set(next))));
      }
      return 1 + dfs(node.next, new Set(next));
    }
    return dfs(treeData.startNode, new Set());
  } catch (_) {
    return 5; // fallback
  }
}

/**
 * QnAScreen — Q&A 화면 (세션 생성/관리, undo, 진행 바 포함)
 */
function QnAScreen({ wizard, options, inkComponents }) {
  const { Box, Text, useInput } = inkComponents;
  const [sessionId, setSessionId] = React.useState(null);
  const totalSteps = React.useMemo(() => countSteps(wizard.treeId), [wizard.treeId]);

  // mount 시 세션 생성
  React.useEffect(() => {
    const { session } = startSession(wizard.treeId, { scanResult: wizard.scanResult, presetId: wizard.presetId });
    setSessionId(session.sessionId);
    return () => {
      // cleanup: 세션이 아직 살아있으면 파기
      try { destroySession(session.sessionId); } catch (_) {}
    };
  }, []);

  const onSessionReset = React.useCallback((newSid) => {
    setSessionId(newSid);
  }, []);

  const {
    question, completed, answers, history, submit, submitError, undo, undoStack, inputSeed, prefill,
  } = useQnASession({
    sessionId: sessionId || '__placeholder__',
    treeId: wizard.treeId,
    onSessionReset,
    sessionOptions: { scanResult: wizard.scanResult },
  });

  const stepNum = history.length + 1;
  const projectRoot = wizard.scanResult?.path || process.cwd();

  // 템플릿 답변 자동 제출
  const templateAnswers = { ...(wizard.prefill || {}), ...(options.templateAnswers || {}) };
  React.useEffect(() => {
    if (!question || !sessionId) return;
    const val = templateAnswers[question.key];
    if (val !== undefined) {
      submit(val);
    }
  }, [question?.key, sessionId]);

  // 완료 처리: buildPrompt → wizard.goToResult
  React.useEffect(() => {
    if (!completed) return;
    try {
      const prompt = buildPrompt(wizard.treeId, answers, wizard.scanResult);
      // destroySession은 unmount cleanup에서 처리되므로 여기서는 호출하지 않음
      wizard.goToResult(answers, prompt);
    } catch (err) {
      // buildPrompt 실패 시 그냥 빈 프롬프트로 진행
      wizard.goToResult(answers, `프롬프트 생성 실패: ${err.message}`);
    }
  }, [completed]);

  // Esc → undo
  useInput((input, key) => {
    if (key.escape && undoStack.length > 0) {
      undo();
    }
  });

  // 세션 초기화 전 로딩
  if (!sessionId) {
    return React.createElement(Box, {
      flexDirection: 'column',
      borderStyle: 'round',
      borderColor: 'cyan',
      paddingX: 1,
      paddingY: 0,
    },
      React.createElement(Header, { treeId: wizard.treeId, inkComponents }),
      React.createElement(Box, { padding: 1 },
        React.createElement(Text, { dimColor: true }, '  세션을 초기화하는 중...')
      )
    );
  }

  if (completed) {
    return React.createElement(Box, {
      flexDirection: 'column',
      borderStyle: 'round',
      borderColor: 'cyan',
      paddingX: 1,
      paddingY: 0,
    },
      React.createElement(Header, { treeId: wizard.treeId, inkComponents }),
      React.createElement(Box, { padding: 1 },
        React.createElement(Text, { color: 'green', bold: true }, '  ✓ 완료! 프롬프트를 생성합니다...')
      )
    );
  }

  return React.createElement(Box, {
    flexDirection: 'column',
    borderStyle: 'round',
    borderColor: 'cyan',
    paddingX: 1,
    paddingY: 0,
  },
    React.createElement(Header, { treeId: wizard.treeId, inkComponents }),
    React.createElement(ProgressList, { history, inkComponents }),
    question
        ? React.createElement(QuestionBox, {
          key: `${question.nodeId}:${inputSeed}`,
          question,
          projectRoot,
          submit,
          submitError,
          prefillValue: prefill.key && question.key === prefill.key ? prefill.value : '',
          stepNum,
          totalSteps,
          inkComponents,
        })
      : null,
    React.createElement(StatusBar, {
      question,
      undoAvailable: undoStack.length > 0,
      inkComponents,
    })
  );
}

module.exports = QnAScreen;
