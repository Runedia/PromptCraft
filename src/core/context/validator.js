'use strict';

const { estimateTokens } = require('../../shared/utils');

/** 포맷별 권장 제한 */
const FORMAT_LIMITS = {
  claude:      { maxLines: 200, maxTokens: 8000 },
  gemini:      { maxLines: 300, maxTokens: 12000 },
  cursorrules: { maxLines: 150, maxTokens: 6000 },
};

/**
 * 생성된 컨텍스트 파일의 품질을 검증한다.
 * @param {string} content - 생성된 파일 내용
 * @param {string} format - 포맷 이름 (claude, gemini, cursorrules)
 * @returns {{ warnings: string[], lineCount: number, tokenCount: number }}
 */
function validateContext(content, format) {
  const warnings = [];
  const lineCount = content.split('\n').length;
  const tokenCount = estimateTokens(content);

  const limits = FORMAT_LIMITS[format];
  if (limits) {
    if (lineCount > limits.maxLines) {
      warnings.push(
        `${format} 파일이 권장 라인 수(${limits.maxLines}줄)를 초과했습니다: ${lineCount}줄`
      );
    }
    if (tokenCount > limits.maxTokens) {
      warnings.push(
        `${format} 파일의 추정 토큰 수(${tokenCount})가 권장 한도(${limits.maxTokens})를 초과했습니다`
      );
    }
  }

  return { warnings, lineCount, tokenCount };
}

module.exports = { validateContext, FORMAT_LIMITS };
