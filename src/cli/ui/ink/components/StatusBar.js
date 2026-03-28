'use strict';

const React = require('react');

const HINTS = {
  'multiline-mention': '@경로 + Tab 자동완성  |  ↑↓ 탐색  |  빈 줄로 완료',
  'multiline':         'Shift+Enter 줄바꿈  |  빈 줄로 완료',
  'select':            '↑↓ 선택  |  Enter 확인',
  'text':              'Enter로 확인',
};

function StatusBar({ question, inkComponents }) {
  const { Box, Text } = inkComponents;
  if (!question) return null;

  const hint = HINTS[question.inputType] || 'Enter로 확인';

  return React.createElement(Box, { marginTop: 1, paddingX: 2 },
    React.createElement(Text, { dimColor: true }, '힌트: '),
    React.createElement(Text, { dimColor: true, italic: true }, hint)
  );
}

module.exports = StatusBar;
