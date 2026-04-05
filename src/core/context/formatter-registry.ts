import { ContextError } from '../../shared/errors.js';

/** @type {Map<string, import('./formatters/base-formatter.js').BaseFormatter>} */
const registry = new Map();

/**
 * 포맷터를 레지스트리에 등록한다.
 * @param {import('./formatters/base-formatter.js').BaseFormatter} formatter
 */
function registerFormatter(formatter) {
  registry.set(formatter.formatName, formatter);
}

/**
 * 포맷 이름으로 포맷터를 조회한다.
 * @param {string} formatName
 * @returns {import('./formatters/base-formatter.js').BaseFormatter}
 */
function getFormatter(formatName) {
  const formatter = registry.get(formatName);
  if (!formatter) {
    throw new ContextError(`등록되지 않은 포맷입니다: ${formatName}`);
  }
  return formatter;
}

/**
 * 등록된 모든 포맷 이름을 반환한다.
 * @returns {string[]}
 */
function getRegisteredFormats() {
  return Array.from(registry.keys());
}

/**
 * 등록된 모든 포맷의 { formatName: fileName } 맵을 반환한다.
 * @returns {Record<string, string>}
 */
function getFormatFileNames() {
  const result = {};
  for (const [name, formatter] of registry) {
    result[name] = formatter.fileName;
  }
  return result;
}

// 기본 포맷터 등록
import { ClaudeFormatter } from './formatters/claude-formatter.js';
import { CursorrulesFormatter } from './formatters/cursorrules-formatter.js';
import { GeminiFormatter } from './formatters/gemini-formatter.js';

registerFormatter(new ClaudeFormatter());
registerFormatter(new GeminiFormatter());
registerFormatter(new CursorrulesFormatter());

export { getFormatFileNames, getFormatter, getRegisteredFormats, registerFormatter };
