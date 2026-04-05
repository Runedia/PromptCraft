'use strict';

const React = require('react');

/**
 * Wizard 스크린 상태 머신 + 공유 데이터 관리
 *
 * 스크린 전환: TREE_SELECT → PRESET_SELECT → SCAN → QNA → RESULT
 *
 * 초기 화면 결정:
 *   - initialTreeId && noScan → QNA (treeId 세팅, scanResult=null)
 *   - initialTreeId (스캔 필요) → SCAN (treeId 세팅)
 *   - noScan (트리 미지정) → (불가능, TREE_SELECT에서 goToScan이 noScan 체크)
 *   - 기본 → TREE_SELECT
 *
 * @param {object} options
 * @param {string}  [options.initialTreeId]
 * @param {string}  [options.initialScanPath]
 * @param {boolean} [options.noScan]
 * @param {function} [options.onCancel]
 */
function useWizard(options) {
  // inkComponents는 App에서 전달받지 않으므로 useApp은 App.js에서 처리
  // 여기서는 순수 상태 관리만 담당

  function deriveInitialScreen() {
    if (options.initialTreeId && options.noScan) return 'QNA';
    if (options.initialTreeId) return 'PRESET_SELECT';
    return 'TREE_SELECT';
  }

  const [screen, setScreen]       = React.useState(deriveInitialScreen);
  const [treeId, setTreeId]       = React.useState(options.initialTreeId || null);
  const [scanResult, setScanResult] = React.useState(null);
  const [presetId, setPresetId]     = React.useState(null);
  const [prefill, setPrefill]       = React.useState({});
  const [answers, setAnswers]     = React.useState(null);
  const [prompt, setPrompt]       = React.useState(null);

  // exitFn은 App.js에서 주입 (useApp 훅은 inkComponents 경유)
  const [exitFn, setExitFn]       = React.useState(null);

  const goToPreset = React.useCallback((id) => {
    setTreeId(id);
    setScreen('PRESET_SELECT');
  }, []);

  const goToScan = React.useCallback(({ presetId: nextPresetId, prefill: nextPrefill } = {}) => {
    setPresetId(nextPresetId || null);
    setPrefill(nextPrefill || {});
    setScreen('SCAN');
  }, []);

  const goToQnA = React.useCallback((result) => {
    setScanResult(result);
    setScreen('QNA');
  }, []);

  const goToResult = React.useCallback((ans, prom) => {
    setAnswers(ans);
    setPrompt(prom);
    setScreen('RESULT');
  }, []);

  const exit = React.useCallback(() => {
    if (exitFn) exitFn();
    if (options.onCancel) options.onCancel();
  }, [exitFn, options.onCancel]);

  const registerExit = React.useCallback((fn) => {
    setExitFn(() => fn);
  }, []);

  return {
    screen,
    treeId,
    scanResult,
    presetId,
    prefill,
    answers,
    prompt,
    goToPreset,
    goToScan,
    goToQnA,
    goToResult,
    exit,
    registerExit,
  };
}

module.exports = { useWizard };
