import React from 'react';
import { QNA_TREE_LABELS } from '../../../../shared/constants.js';

function Header({ treeId, inkComponents }) {
  const { Box, Text } = inkComponents;

  return React.createElement(
    Box,
    { marginBottom: 1 },
    React.createElement(Text, { bold: true, color: 'cyanBright' }, 'PromptCraft'),
    React.createElement(Text, { color: 'gray' }, '  ›  '),
    React.createElement(Text, { bold: true, color: 'white' }, QNA_TREE_LABELS[treeId] || treeId)
  );
}

export default Header;
