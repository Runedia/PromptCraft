'use strict';

const React = require('react');
const { removeLastGrapheme } = require('../utils/text');

function TextInput({ required, onSubmit, initialValue, inkComponents }) {
  const { Box, Text, useInput } = inkComponents;
  const [value, setValue]   = React.useState(initialValue || '');
  const [error, setError]   = React.useState('');
  const [done, setDone]     = React.useState(false);

  useInput((input, key) => {
    if (done) return;
    if (key.return) {
      if (required && !value.trim()) {
        setError('필수 항목입니다.');
        return;
      }
      setDone(true);
      onSubmit(value.trim());
      return;
    }
    if (key.backspace || key.delete) {
      setValue(v => removeLastGrapheme(v));
      setError('');
      return;
    }
    if (input && !key.ctrl && !key.meta) {
      setValue(v => v + input);
      setError('');
    }
  });

  if (done) return null;
  return React.createElement(Box, { flexDirection: 'column' },
    React.createElement(Box, { flexDirection: 'row' },
      React.createElement(Text, { color: 'cyan' }, '> '),
      React.createElement(Text, null, value),
      React.createElement(Text, { color: 'cyan' }, '▌')
    ),
    error
      ? React.createElement(Text, { color: 'red' }, `  ${error}`)
      : null
  );
}

module.exports = TextInput;
