import React from 'react';
import { removeLastGrapheme } from '../utils/text.js';

function MultilineInput({ onSubmit, initialValue, inkComponents }) {
  const { Box, Text, useInput } = inkComponents;
  const initialLines = React.useMemo(() => {
    if (typeof initialValue !== 'string' || initialValue.length === 0) return [];
    return initialValue.split('\n');
  }, [initialValue]);
  const [lines, setLines] = React.useState(initialLines.slice(0, -1));
  const [curLine, setCurLine] = React.useState(
    initialLines.length > 0 ? initialLines[initialLines.length - 1] : ''
  );
  const [done, setDone] = React.useState(false);

  useInput((input, key) => {
    if (done) return;
    if (key.return) {
      if (curLine === '') {
        // 빈 줄 = 완료
        setDone(true);
        const text = lines.join('\n');
        onSubmit(text);
        return;
      }
      setLines((prev) => [...prev, curLine]);
      setCurLine('');
      return;
    }
    if (key.backspace || key.delete) {
      if (curLine.length > 0) {
        setCurLine((v) => removeLastGrapheme(v));
      } else if (lines.length > 0) {
        // 이전 줄로 이동
        const prev = lines[lines.length - 1];
        setLines((l) => l.slice(0, -1));
        setCurLine(prev);
      }
      return;
    }
    if (input && !key.ctrl && !key.meta) {
      setCurLine((v) => v + input);
    }
  });

  if (done) return null;
  return React.createElement(
    Box,
    { flexDirection: 'column' },
    ...lines.map((ln, i) =>
      React.createElement(
        Box,
        { key: `line-${i}` },
        React.createElement(Text, { color: 'gray' }, '  '),
        React.createElement(Text, { dimColor: true }, ln)
      )
    ),
    React.createElement(
      Box,
      { flexDirection: 'row' },
      React.createElement(Text, { color: 'cyan' }, '> '),
      React.createElement(Text, null, curLine),
      React.createElement(Text, { color: 'cyan' }, '▌')
    )
  );
}

export default MultilineInput;
