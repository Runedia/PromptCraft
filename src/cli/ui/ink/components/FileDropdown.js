'use strict';

const React = require('react');

function FileDropdown({ candidates, activeIdx, inkComponents }) {
  const { Box, Text } = inkComponents;
  if (!candidates || candidates.length === 0) return null;

  const PAGE = 12;
  // activeIdx가 항상 윈도우 안에 들어오도록 windowStart 계산
  const windowStart = Math.max(0, Math.min(activeIdx - Math.floor(PAGE / 2), candidates.length - PAGE));
  const visible = candidates.slice(windowStart, windowStart + PAGE);

  const hasMore  = windowStart + PAGE < candidates.length;
  const hasAbove = windowStart > 0;
  const header   = hasAbove
    ? `┌── 파일 목록 (↑ 더 있음) ──`
    : '┌── 파일 목록 ──────────────';
  const footer   = hasMore
    ? '└── ↓ 더 있음 ──────────────'
    : '└───────────────────────────';

  return React.createElement(Box, {
    flexDirection: 'column',
    marginLeft: 4,
    marginTop: 0,
  },
    React.createElement(Box, null,
      React.createElement(Text, { dimColor: true }, header)
    ),
    ...visible.map((c, i) => {
      const realIdx  = windowStart + i;
      const isActive = realIdx === activeIdx;
      const isDir    = c.endsWith('/');
      const icon     = isDir ? '/' : ' ';

      return React.createElement(Box, { key: `file-${realIdx}-${c}` },
        React.createElement(Text, { dimColor: true }, '│ '),
        React.createElement(Text, {
          color: isActive ? 'cyanBright' : 'gray',
          bold: isActive,
        },
          `${isActive ? '❯ ' : '  '}${icon} ${c}`
        )
      );
    }),
    React.createElement(Box, null,
      React.createElement(Text, { dimColor: true }, footer)
    )
  );
}

module.exports = FileDropdown;
