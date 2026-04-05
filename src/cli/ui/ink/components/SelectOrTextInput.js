'use strict';

const React = require('react');
const SelectInput = require('./SelectInput');
const TextInput = require('./TextInput');

function SelectOrTextInput({ options, onSubmit, initialValue, required, inkComponents }) {
  const { Box, Text } = inkComponents;
  const optionValues = (options || []).map((item) => (typeof item === 'string' ? item : item.value));
  const shouldStartText = typeof initialValue === 'string' && initialValue && !optionValues.includes(initialValue);
  const [mode, setMode] = React.useState(shouldStartText ? 'text' : 'select');

  if (mode === 'text') {
    return React.createElement(TextInput, {
      required: required !== false,
      initialValue: shouldStartText ? initialValue : '',
      onSubmit,
      inkComponents,
    });
  }

  return React.createElement(Box, { flexDirection: 'column' },
    React.createElement(SelectInput, {
      options,
      initialValue,
      onSubmit: (value) => {
        if (value === '__custom__') {
          setMode('text');
          return;
        }
        onSubmit(value);
      },
      inkComponents,
    }),
    React.createElement(Box, { marginTop: 0 },
      React.createElement(Text, { dimColor: true }, '  직접 입력을 선택하면 텍스트 입력으로 전환됩니다.')
    )
  );
}

module.exports = SelectOrTextInput;
