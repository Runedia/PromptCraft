'use strict';

function validate(node, value) {
  if (node.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    return { valid: false, error: '필수 입력 항목입니다.' };
  }
  if (node.inputType === 'select' && value && node.options) {
    if (!node.options.includes(value)) {
      return { valid: false, error: `유효하지 않은 옵션입니다. 선택 가능: ${node.options.join(', ')}` };
    }
  }
  return { valid: true };
}

module.exports = { validate };
