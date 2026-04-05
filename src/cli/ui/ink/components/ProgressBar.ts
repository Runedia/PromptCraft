import React from 'react';

/**
 * 시각적 진행 바 컴포넌트
 * @param {object} props
 * @param {number} props.current  - 현재 스텝 (1-based)
 * @param {number} props.total    - 전체 스텝 수
 * @param {number} [props.width=20] - 바 길이 (문자 수)
 * @param {object} props.inkComponents
 */
function ProgressBar({ current, total, width = 20, inkComponents }) {
  const { Box, Text } = inkComponents;
  if (!total || total <= 0) return null;

  const filled = Math.round(((current - 1) / total) * width);
  const _bar = '█'.repeat(filled) + '░'.repeat(width - filled);

  return React.createElement(
    Box,
    null,
    React.createElement(Text, { color: 'cyan' }, '['),
    React.createElement(Text, { color: 'cyanBright' }, '█'.repeat(filled)),
    React.createElement(Text, { dimColor: true }, '░'.repeat(width - filled)),
    React.createElement(Text, { color: 'cyan' }, ']'),
    React.createElement(Text, { dimColor: true }, `  ${current} / ${total}`)
  );
}

export default ProgressBar;
