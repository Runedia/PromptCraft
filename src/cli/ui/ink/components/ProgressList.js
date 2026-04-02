'use strict';

const React = require('react');

function ProgressList({ history, inkComponents }) {
  const { Box, Text } = inkComponents;
  if (!history || history.length === 0) return null;

  return React.createElement(Box, { flexDirection: 'column', marginBottom: 1 },
    ...history.map((item, i) => {
      const shortQ = item.question.length > 40
        ? item.question.slice(0, 40) + '…'
        : item.question;
      const displayA = item.answer.replace(/\n/g, ' ↵ ');
      const shortA = displayA.length > 50
        ? displayA.slice(0, 50) + '…'
        : displayA;

      return React.createElement(Box, { key: `history-${i}` },
        React.createElement(Text, { color: 'green' }, '  ✓ '),
        React.createElement(Text, { color: 'gray' }, `[${i + 1}] `),
        React.createElement(Text, { dimColor: true }, shortQ),
        React.createElement(Text, { color: 'gray' }, '  →  '),
        React.createElement(Text, { dimColor: true }, shortA)
      );
    })
  );
}

module.exports = ProgressList;
