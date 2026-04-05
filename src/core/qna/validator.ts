import type { QnAOption, QnATreeNode, QnAValidationResult } from '../types.js';

function validate(node: QnATreeNode, value: string): QnAValidationResult {
  if (node.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    return { valid: false, error: '필수 입력 항목입니다.' };
  }
  if (node.inputType === 'multiline-mention') {
    return { valid: true };
  }
  if (node.inputType === 'select-or-text') {
    return { valid: true };
  }
  if (node.inputType === 'select' && value && node.options) {
    const allowedValues = (node.options || [])
      .map((item: QnAOption) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') return item.value;
        return null;
      })
      .filter(Boolean);

    if (!allowedValues.includes(value)) {
      return {
        valid: false,
        error: `유효하지 않은 옵션입니다. 선택 가능: ${allowedValues.join(', ')}`,
      };
    }
  }
  return { valid: true };
}

export { validate };
