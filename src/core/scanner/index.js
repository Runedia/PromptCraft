'use strict';

const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');

const { resolvePath, nowISO } = require('../../shared/utils');
const { ScanError } = require('../../shared/errors');
const { detectLanguages } = require('./language');
const { detectFrameworks } = require('./framework');
const { buildTree } = require('./structure');

const CONFIG_PATTERNS = [
  'package.json',
  '.eslintrc*',
  'tsconfig.json',
  '*.config.js',
  '*.config.ts',
  '.prettierrc*',
];

/** 패키지 계층 구조가 깊은 언어 목록 */
const DEEP_LANGUAGES = new Set(['Java', 'Kotlin', 'C#', 'Go']);
const DEEP_MAX_DEPTH = 5;
const DEFAULT_MAX_DEPTH = 2;

/**
 * 언어 감지 결과 또는 명시적 요청에 따라 maxDepth를 결정한다.
 * @param {{ name: string }[]} languages - 감지된 언어 목록 (비율 순)
 * @param {number|undefined} explicitDepth - CLI 등에서 직접 지정한 depth
 * @returns {number}
 */
function resolveMaxDepth(languages, explicitDepth) {
  if (explicitDepth != null && Number.isInteger(explicitDepth) && explicitDepth > 0) {
    return explicitDepth;
  }
  if (languages.length > 0 && DEEP_LANGUAGES.has(languages[0].name)) {
    return DEEP_MAX_DEPTH;
  }
  return DEFAULT_MAX_DEPTH;
}

/**
 * 디렉토리를 분석해 ScanResult를 반환한다.
 * @param {string} inputPath
 * @param {{ depth?: number }} [options] - 선택 옵션
 * @param {number} [options.depth] - 디렉토리 탐색 최대 깊이 (미지정 시 언어 기반 자동 결정)
 * @returns {Promise<object>} ScanResult
 */
async function scan(inputPath, options = {}) {
  const absolutePath = resolvePath(inputPath);

  if (!fs.existsSync(absolutePath)) {
    throw new ScanError(`경로가 존재하지 않습니다: ${absolutePath}`);
  }
  if (!fs.statSync(absolutePath).isDirectory()) {
    throw new ScanError(`디렉토리가 아닙니다: ${absolutePath}`);
  }

  const languages = detectLanguages(absolutePath);
  const frameworks = detectFrameworks(absolutePath);
  const maxDepth = resolveMaxDepth(languages, options.depth);
  const structure = buildTree(absolutePath, maxDepth);

  // 패키지 매니저 감지
  let packageManager = null;
  if (fs.existsSync(path.join(absolutePath, 'pnpm-lock.yaml'))) {
    packageManager = 'pnpm';
  } else if (fs.existsSync(path.join(absolutePath, 'yarn.lock'))) {
    packageManager = 'yarn';
  } else if (fs.existsSync(path.join(absolutePath, 'package-lock.json'))) {
    packageManager = 'npm';
  }

  // .env 존재 여부
  const hasEnv = fs.existsSync(path.join(absolutePath, '.env'));

  // 설정 파일 목록 (basename만)
  const configFiles = globSync(CONFIG_PATTERNS, {
    cwd: absolutePath,
    nodir: true,
    ignore: ['**/node_modules/**'],
  }).map((f) => path.basename(f));

  return {
    path: absolutePath,
    languages,
    frameworks,
    structure,
    packageManager,
    hasEnv,
    configFiles,
    scannedAt: nowISO(),
  };
}

module.exports = { scan };
