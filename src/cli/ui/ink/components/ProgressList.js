'use strict';

const React = require('react');

function ProgressList({ history, inkComponents }) {
  const { Box, Text } = inkComponents;
  if (!history || history.length === 0) return null;

  return React.createElement(Box, { flexDirection: 'column', marginBottom: 1 },
    ...history.map((item, i) => {
      const shortQ = item.question.length > 28
        ? item.question.slice(0, 28) + '…'
        : item.question;
      const shortA = item.answer.length > 32
        ? item.answer.slice(0, 32).replace(/\n/g, ' ') + '…'
        : item.answer.replace(/\n/g, ' ');

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
