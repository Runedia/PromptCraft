import React from 'react';

function SelectInput({ options, onSubmit, initialValue, inkComponents }) {
  const { Box, Text, useInput } = inkComponents;

  const items = (options || []).map((o) => (typeof o === 'string' ? { name: o, value: o } : o));
  const [idx, setIdx] = React.useState(() => {
    const found = items.findIndex((item) => item.value === initialValue);
    return found >= 0 ? found : 0;
  });
  const [done, setDone] = React.useState(false);

  useInput((_input, key) => {
    if (done) return;
    if (key.upArrow) setIdx((i) => Math.max(0, i - 1));
    if (key.downArrow) setIdx((i) => Math.min(items.length - 1, i + 1));
    if (key.return && items.length > 0) {
      setDone(true);
      onSubmit(items[idx].value);
    }
  });

  if (done) return null;
  return React.createElement(
    Box,
    { flexDirection: 'column' },
    ...items.map((item, i) => {
      const isActive = i === idx;
      const label = item.label || item.name || item.value;
      return React.createElement(
        Box,
        { key: `select-${item.value}` },
        React.createElement(
          Box,
          { flexDirection: 'column' },
          React.createElement(
            Text,
            {
              color: isActive ? 'cyanBright' : 'gray',
              bold: isActive,
            },
            `  ${isActive ? '❯ ' : '  '}${label}`
          ),
          item.description
            ? React.createElement(
                Box,
                { marginLeft: 4 },
                React.createElement(Text, { dimColor: true }, item.description)
              )
            : null
        )
      );
    })
  );
}

export default SelectInput;
