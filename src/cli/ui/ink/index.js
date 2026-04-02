'use strict';

const { React, loadInk } = require('./bridge');

/**
 * Ink 기반 Wizard UI를 실행하고 완료 결과를 반환한다.
 *
 * @param {object} params
 * @param {string}  [params.initialTreeId]    - --tree 옵션 (없으면 TreeSelectScreen에서 선택)
 * @param {string}  [params.initialScanPath]  - --scan 경로 (없으면 ScanScreen에서 선택)
 * @param {boolean} [params.noScan]           - --no-scan 플래그
 * @param {object}  [params.templateAnswers]  - --template 로드된 answers
 * @param {boolean} [params.noCopy]           - --no-copy 플래그
 * @param {string}  [params.output]           - --output 경로
 * @param {function} [params.onCancel]        - 취소 시 콜백
 * @returns {Promise<{ answers, prompt, treeId, scanResult }>}
 */
async function renderInkApp(params) {
  const ink = await loadInk();
  const App = require('./App');

  let resolvedResult = null;
  let cancelled = false;

  const options = {
    initialTreeId:   params.initialTreeId,
    initialScanPath: params.initialScanPath,
    noScan:          params.noScan || false,
    templateAnswers: params.templateAnswers || {},
    noCopy:          params.noCopy || false,
    output:          params.output,
    onCancel: () => {
      cancelled = true;
      instance.unmount();
      if (params.onCancel) params.onCancel();
    },
    onComplete: (result) => {
      resolvedResult = result;
      instance.unmount();
    },
  };

  const instance = ink.render(
    React.createElement(App, {
      options,
      inkComponents: ink,
    })
  );

  // waitUntilExit()은 unmount() 후 stdin/stdout이 완전히 복원된 뒤 resolve됨.
  await instance.waitUntilExit();

  if (cancelled) throw new Error('CANCELLED');
  return resolvedResult;
}

module.exports = { renderInkApp };
