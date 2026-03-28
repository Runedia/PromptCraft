'use strict';

const React = require('react');

function SelectInput({ options, onSubmit, inkComponents }) {
  const { Box, Text, useInput } = inkComponents;
  const [idx, setIdx]   = React.useState(0);
  const [done, setDone] = React.useState(false);

  const items = (options || []).map(o =>
    typeof o === 'string' ? { name: o, value: o } : o
  );

  useInput((input, key) => {
    if (done) return;
    if (key.upArrow)   setIdx(i => Math.max(0, i - 1));
    if (key.downArrow) setIdx(i => Math.min(items.length - 1, i + 1));
    if (key.return && items.length > 0) {
      setDone(true);
      onSubmit(items[idx].value);
    }
  });

  if (done) return null;
  return React.createElement(Box, { flexDirection: 'column' },
    ...items.map((item, i) => {
      const isActive = i === idx;
      return React.createElement(Box, { key: `select-${item.value}` },
        React.createElement(Text, {
          color: isActive ? 'cyanBright' : 'gray',
          bold:  isActive,
        },
          `  ${isActive ? '❯ ' : '  '}${item.name}`
        )
      );
    })
  );
}

module.exports = SelectInput;
