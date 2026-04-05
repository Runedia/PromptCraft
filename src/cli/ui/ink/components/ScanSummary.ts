import React from 'react';

const BAR_WIDTH = 20;
const MAX_LANG = 5;

/**
 * 스캔 결과 시각화 컴포넌트
 * @param {object} props
 * @param {object} props.scanResult - ScanResult 객체
 * @param {object} props.inkComponents
 */
function ScanSummary({ scanResult, inkComponents }) {
  const { Box, Text } = inkComponents;
  if (!scanResult) return null;

  const { languages = [], frameworks = [], packageManager } = scanResult;

  // 언어 바 렌더링 (최대 5개)
  const displayLangs = languages.slice(0, MAX_LANG);
  const hiddenCount = languages.length - displayLangs.length;

  const langElements = displayLangs.map((lang, i) => {
    const filled = Math.round(lang.percentage / 5);
    const empty = BAR_WIDTH - filled;
    return React.createElement(
      Box,
      { key: `lang-${i}`, marginLeft: 2 },
      React.createElement(Text, { color: 'white' }, lang.name.padEnd(14)),
      React.createElement(Text, { color: 'cyan' }, '['),
      React.createElement(Text, { color: 'cyanBright' }, '█'.repeat(filled)),
      React.createElement(Text, { dimColor: true }, '░'.repeat(empty)),
      React.createElement(Text, { color: 'cyan' }, ']'),
      React.createElement(
        Text,
        { dimColor: true },
        `  ${lang.percentage.toFixed(1)}%  (${lang.count} files)`
      )
    );
  });

  if (hiddenCount > 0) {
    langElements.push(
      React.createElement(
        Box,
        { key: 'lang-more', marginLeft: 2 },
        React.createElement(Text, { dimColor: true }, `  외 ${hiddenCount}개`)
      )
    );
  }

  // 프레임워크 배지
  const badges = [];
  if (frameworks && frameworks.length > 0) {
    frameworks.forEach((fw, i) => {
      const label = fw.version ? `${fw.name} ${fw.version}` : fw.name;
      badges.push(
        React.createElement(Text, { key: `fw-${i}`, color: 'greenBright' }, `${label}  `)
      );
    });
  }
  if (packageManager) {
    badges.push(React.createElement(Text, { key: 'pm', color: 'yellow' }, `${packageManager}  `));
  }

  return React.createElement(
    Box,
    { flexDirection: 'column' },
    React.createElement(
      Box,
      { marginBottom: 0 },
      React.createElement(Text, { bold: true, color: 'white' }, '  언어')
    ),
    ...langElements,
    badges.length > 0
      ? React.createElement(
          Box,
          { marginTop: 1, marginLeft: 2 },
          React.createElement(Text, { bold: true, color: 'white' }, '프레임워크  '),
          ...badges
        )
      : null
  );
}

export default ScanSummary;
