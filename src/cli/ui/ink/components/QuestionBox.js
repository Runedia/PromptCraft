'use strict';

const React = require('react');
const TextInput      = require('./TextInput');
const MultilineInput = require('./MultilineInput');
const MentionInput   = require('./MentionInput');
const SelectInput    = require('./SelectInput');

function QuestionBox({ question, projectRoot, submit, submitError, stepNum, totalSteps, inkComponents }) {
  const { Box, Text } = inkComponents;
  if (!question) return null;

  let inputEl;
  switch (question.inputType) {
    case 'select':
      inputEl = React.createElement(SelectInput, {
        options: question.options, onSubmit: submit, inkComponents,
      });
      break;
    case 'multiline':
      inputEl = React.createElement(MultilineInput, {
        onSubmit: submit, inkComponents,
      });
      break;
    case 'multiline-mention':
      inputEl = React.createElement(MentionInput, {
        projectRoot, onSubmit: submit, inkComponents,
      });
      break;
    default:
      inputEl = React.createElement(TextInput, {
        required: question.required, onSubmit: submit, inkComponents,
      });
  }

  const stepLabel = totalSteps ? `[${stepNum}/${totalSteps}]` : `[${stepNum}]`;

  return React.createElement(Box, { flexDirection: 'column', marginBottom: 1 },
    // 질문 헤더
    React.createElement(Box, { marginBottom: 0 },
      React.createElement(Text, { color: 'yellow', bold: true }, `  ${stepLabel} `),
      React.createElement(Text, { bold: true }, question.question)
    ),
    // 구분선
    React.createElement(Box, { marginLeft: 2, marginBottom: 0 },
      React.createElement(Text, { dimColor: true }, '─'.repeat(48))
    ),
    // 입력 영역
    React.createElement(Box, { marginLeft: 2 }, inputEl),
    // 에러
    submitError
      ? React.createElement(Box, { marginLeft: 2 },
          React.createElement(Text, { color: 'red' }, `  ${submitError}`)
        )
      : null
  );
}

module.exports = QuestionBox;
