'use strict';

const React = require('react');

function MultilineInput({ onSubmit, inkComponents }) {
  const { Box, Text, useInput } = inkComponents;
  const [lines, setLines]     = React.useState([]);
  const [curLine, setCurLine] = React.useState('');
  const [done, setDone]       = React.useState(false);

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
      setLines(prev => [...prev, curLine]);
      setCurLine('');
      return;
    }
    if (key.backspace || key.delete) {
      if (curLine.length > 0) {
        setCurLine(v => v.slice(0, -1));
      } else if (lines.length > 0) {
        // 이전 줄로 이동
        const prev = lines[lines.length - 1];
        setLines(l => l.slice(0, -1));
        setCurLine(prev);
      }
      return;
    }
    if (input && !key.ctrl && !key.meta) {
      setCurLine(v => v + input);
    }
  });

  if (done) return null;
  return React.createElement(Box, { flexDirection: 'column' },
    ...lines.map((ln, i) =>
      React.createElement(Box, { key: `line-${i}` },
        React.createElement(Text, { color: 'gray' }, '  '),
        React.createElement(Text, { dimColor: true }, ln)
      )
    ),
    React.createElement(Box, { flexDirection: 'row' },
      React.createElement(Text, { color: 'cyan' }, '> '),
      React.createElement(Text, null, curLine),
      React.createElement(Text, { color: 'cyan' }, '▌')
    )
  );
}

module.exports = MultilineInput;
