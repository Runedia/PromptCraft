'use strict';

const React = require('react');
const { QNA_TREE_LABELS } = require('../../../../shared/constants');

function Header({ treeId, inkComponents }) {
  const { Box, Text } = inkComponents;

  return React.createElement(Box, { marginBottom: 1 },
    React.createElement(Text, { bold: true, color: 'cyanBright' }, 'PromptCraft'),
    React.createElement(Text, { color: 'gray' }, '  ›  '),
    React.createElement(Text, { bold: true, color: 'white' },
      QNA_TREE_LABELS[treeId] || treeId
    )
  );
}

module.exports = Header;
