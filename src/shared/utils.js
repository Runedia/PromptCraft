'use strict';

const path = require('path');
const os = require('os');

/**
 * 경로를 절대 경로로 정규화한다. `~`를 홈 디렉토리로 확장.
 */
function resolvePath(inputPath) {
  if (!inputPath) return process.cwd();
  if (inputPath.startsWith('~')) {
    return path.join(os.homedir(), inputPath.slice(1));
  }
  return path.resolve(inputPath);
}

/**
 * ISO8601 타임스탬프 반환
 */
function nowISO() {
  return new Date().toISOString();
}

/**
 * 날짜 문자열을 "YYYY-MM-DD HH:mm" 형식으로 포맷
 */
function formatDate(isoString) {
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
         `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * 문자열을 최대 길이로 자르고 "..." 추가
 */
function truncate(str, maxLength = 80) {
  if (!str || str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * 대략적인 토큰 수 추정 (글자 수 / 4)
 */
function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * 객체를 JSON 문자열로 직렬화 (DB 저장용)
 */
function toJson(obj) {
  return JSON.stringify(obj);
}

/**
 * JSON 문자열을 객체로 파싱 (DB 조회용), 실패 시 null 반환
 */
function fromJson(str) {
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

/**
 * 경과 시간을 ms → "1.23s" 형식으로 변환
 */
function formatDuration(ms) {
  return `${(ms / 1000).toFixed(2)}s`;
}

module.exports = {
  resolvePath,
  nowISO,
  formatDate,
  truncate,
  estimateTokens,
  toJson,
  fromJson,
  formatDuration,
};
