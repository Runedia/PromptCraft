'use strict';

const React = require('react');
const Header = require('../components/Header');
const { listPresets } = require('../../../../core/prompt/presets');
const { QNA_TREE_LABELS } = require('../../../../shared/constants');

function PresetSelectScreen({ wizard, inkComponents }) {
  const { Box, Text, useInput } = inkComponents;
  const presets = React.useMemo(() => listPresets(wizard.treeId), [wizard.treeId]);
  const items = React.useMemo(() => ([
    ...presets.map((preset) => ({ ...preset, type: 'preset' })),
    { id: '__direct__', name: '직접 입력 (프리셋 없이 시작)', description: '', type: 'direct' },
  ]), [presets]);

  const [idx, setIdx] = React.useState(0);
  const [done, setDone] = React.useState(false);

  useInput((input, key) => {
    if (done) return;
    if (key.escape) {
      setDone(true);
      wizard.goToScan({ presetId: null, prefill: {} });
      return;
    }
    if (key.upArrow) setIdx((i) => Math.max(0, i - 1));
    if (key.downArrow) setIdx((i) => Math.min(items.length - 1, i + 1));
    if (key.return) {
      setDone(true);
      const selected = items[idx];
      if (!selected || selected.type === 'direct') {
        wizard.goToScan({ presetId: null, prefill: {} });
        return;
      }
      const firstExample = Array.isArray(selected.examples) && selected.examples.length > 0
        ? selected.examples[0]
        : null;
      wizard.goToScan({
        presetId: selected.id,
        prefill: firstExample && firstExample.prefill ? firstExample.prefill : {},
      });
    }
  });

  return React.createElement(Box, {
    flexDirection: 'column',
    borderStyle: 'round',
    borderColor: 'cyan',
    paddingX: 1,
    paddingY: 0,
  },
    React.createElement(Header, { treeId: `${QNA_TREE_LABELS[wizard.treeId] || wizard.treeId} — 빠른 시작`, inkComponents }),
    React.createElement(Box, { marginBottom: 1 },
      React.createElement(Text, { dimColor: true }, '  자주 사용되는 시나리오를 선택하거나 직접 입력하세요.')
    ),
    ...items.map((item, i) => {
      const isActive = i === idx;
      return React.createElement(Box, {
        key: item.id,
        flexDirection: 'column',
      },
      React.createElement(Box, null,
        React.createElement(Text, { color: isActive ? 'cyanBright' : 'gray', bold: isActive }, `  ${isActive ? '❯ ' : '  '}${item.name}`)
      ),
      item.description
        ? React.createElement(Box, { marginLeft: 4 },
            React.createElement(Text, { dimColor: true }, item.description)
          )
        : null
      );
    }),
    React.createElement(Box, { marginTop: 1, paddingX: 2 },
      React.createElement(Text, { dimColor: true }, '힌트: ↑↓ 선택  |  Enter 확인  |  Esc 건너뜀')
    )
  );
}

module.exports = PresetSelectScreen;
