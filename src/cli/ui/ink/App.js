'use strict';

const React = require('react');
const { useWizard }      = require('./hooks/useWizard');
const TreeSelectScreen   = require('./screens/TreeSelectScreen');
const PresetSelectScreen = require('./screens/PresetSelectScreen');
const ScanScreen         = require('./screens/ScanScreen');
const QnAScreen          = require('./screens/QnAScreen');
const ResultScreen       = require('./screens/ResultScreen');

/**
 * App — 스크린 라우터
 *
 * options 객체는 renderInkApp이 구성해 전달한다.
 * inkComponents는 bridge.js를 통해 로드된 Ink 모듈이다.
 */
function App({ options, inkComponents }) {
  const { useInput, useApp } = inkComponents;
  const { exit } = useApp();

  const wizard = useWizard(options);

  // useApp().exit 함수를 wizard에 등록 (Ctrl+C 처리용)
  React.useEffect(() => {
    wizard.registerExit(exit);
  }, []);

  // Ctrl+C 전역 처리
  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      exit();
      if (options.onCancel) options.onCancel();
    }
  });

  switch (wizard.screen) {
    case 'TREE_SELECT':
      return React.createElement(TreeSelectScreen, { wizard, options, inkComponents });
    case 'PRESET_SELECT':
      return React.createElement(PresetSelectScreen, { wizard, options, inkComponents });
    case 'SCAN':
      return React.createElement(ScanScreen, { wizard, options, inkComponents });
    case 'QNA':
      return React.createElement(QnAScreen, { wizard, options, inkComponents });
    case 'RESULT':
      return React.createElement(ResultScreen, { wizard, options, inkComponents });
    default:
      return null;
  }
}

module.exports = App;
