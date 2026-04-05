import React from 'react';
import { QNA_TREE_DESCRIPTIONS, QNA_TREE_LABELS } from '../../../../shared/constants.js';
import Header from '../components/Header.js';

const TREE_ITEMS = Object.entries(QNA_TREE_LABELS).map(([value, name]) => ({
  value,
  name,
  description: QNA_TREE_DESCRIPTIONS[value] || '',
}));

/**
 * TreeSelectScreen — 트리(상황) 선택 화면
 * Inquirer askSelect를 Ink 내에서 대체한다.
 */
function TreeSelectScreen({ wizard, options, inkComponents }) {
  const { Box, Text, useInput } = inkComponents;
  const [idx, setIdx] = React.useState(0);
  const [done, setDone] = React.useState(false);

  // initialTreeId가 있으면 이 화면을 건너뜀
  React.useEffect(() => {
    if (options.initialTreeId) {
      wizard.goToPreset(options.initialTreeId);
    }
  }, [wizard.goToPreset, options.initialTreeId]);

  useInput((_input, key) => {
    if (done) return;
    if (key.upArrow) setIdx((i) => Math.max(0, i - 1));
    if (key.downArrow) setIdx((i) => Math.min(TREE_ITEMS.length - 1, i + 1));
    if (key.return) {
      setDone(true);
      wizard.goToPreset(TREE_ITEMS[idx].value);
    }
  });

  return React.createElement(
    Box,
    {
      flexDirection: 'column',
      borderStyle: 'round',
      borderColor: 'cyan',
      paddingX: 1,
      paddingY: 0,
    },
    React.createElement(Header, { treeId: '상황 선택', inkComponents }),
    React.createElement(
      Box,
      { marginBottom: 1 },
      React.createElement(Text, { bold: true }, '  어떤 상황에 대한 프롬프트를 만들어 드릴까요?')
    ),
    ...TREE_ITEMS.map((item, i) => {
      const isActive = i === idx;
      return React.createElement(
        Box,
        {
          key: item.value,
          flexDirection: 'column',
          marginBottom: 0,
        },
        React.createElement(
          Box,
          null,
          React.createElement(
            Text,
            {
              color: isActive ? 'cyanBright' : 'gray',
              bold: isActive,
            },
            `  ${isActive ? '❯ ' : '  '}${item.name}`
          )
        ),
        item.description
          ? React.createElement(
              Box,
              { marginLeft: 4 },
              React.createElement(Text, { dimColor: true }, item.description)
            )
          : null
      );
    }),
    React.createElement(
      Box,
      { marginTop: 1, paddingX: 2 },
      React.createElement(Text, { dimColor: true }, '힌트: ↑↓ 선택  |  Enter 확인')
    )
  );
}

export default TreeSelectScreen;
