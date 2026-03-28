'use strict';

const { React, loadInk } = require('./bridge');

/**
 * Ink 기반 Q&A UI를 실행하고 완료된 answers를 반환한다.
 *
 * @param {object} params
 * @param {string} params.treeId         - Q&A 트리 ID
 * @param {string} params.sessionId      - 이미 생성된 세션 ID
 * @param {string} params.projectRoot    - @멘션 파일 루트 경로
 * @param {object} [params.templateAnswers] - 템플릿으로 미리 채울 답변 맵
 * @returns {Promise<object>} 완료된 answers 객체
 */
async function renderInkApp(params) {
  const ink = await loadInk();
  const App = require('./App');

  let resolvedAnswers = null;
  let cancelled = false;

  const instance = ink.render(
    React.createElement(App, {
      treeId:          params.treeId,
      sessionId:       params.sessionId,
      projectRoot:     params.projectRoot,
      templateAnswers: params.templateAnswers || {},
      inkComponents:   ink,
      onComplete: (answers) => {
        resolvedAnswers = answers;
        instance.unmount();
      },
      onCancel: () => {
        cancelled = true;
        instance.unmount();
      },
    })
  );

  // waitUntilExit()은 unmount() 후 stdin/stdout이 완전히 복원된 뒤 resolve됨.
  // 이 시점 이후에 Inquirer 등 다른 stdin 소비자를 안전하게 사용할 수 있음.
  await instance.waitUntilExit();

  if (cancelled) throw new Error('CANCELLED');
  return resolvedAnswers;
}

module.exports = { renderInkApp };
