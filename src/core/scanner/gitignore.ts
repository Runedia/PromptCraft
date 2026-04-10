import fs from 'node:fs';
import path from 'node:path';
import ignore from 'ignore';
import type { IgnoreRules } from '../types.js';

/** 항상 제외할 기본 디렉토리 (gitignore 유무와 무관) */
const DEFAULT_IGNORE_DIRS = ['.git', 'node_modules', '.cache', '.gradle', '.idea', '.vscode', '.claude'];

/**
 * 대상 경로의 .gitignore + 기본 무시 규칙을 병합한 ignore 인스턴스를 생성한다.
 * @param {string} targetPath - 프로젝트 루트 절대 경로
 * @returns {{ ig: import('ignore').Ignore, source: 'gitignore'|'default' }}
 */
function loadIgnoreRules(targetPath: string): IgnoreRules {
  const ig = ignore();

  for (const dir of DEFAULT_IGNORE_DIRS) {
    ig.add(dir);
  }

  const gitignorePath = path.join(targetPath, '.gitignore');
  let source: IgnoreRules['source'] = 'default';

  if (fs.existsSync(gitignorePath)) {
    try {
      const content = fs.readFileSync(gitignorePath, 'utf8');
      ig.add(content);
      source = 'gitignore';
    } catch {
      // 읽기 실패 시 기본 규칙만 사용
    }
  }

  return { ig, source };
}

/**
 * glob용 ignore 패턴 배열을 생성한다. (기본 디렉토리만 포함)
 * @param {{ ig: import('ignore').Ignore, source: string }} ignoreRules
 * @returns {string[]} glob ignore 패턴 배열
 */
function toGlobIgnorePatterns(ignoreRules: IgnoreRules): string[] {
  if (!ignoreRules) {
    return [];
  }
  return DEFAULT_IGNORE_DIRS.map((dir) => `**/${dir}/**`);
}

/**
 * 파일 경로가 무시 규칙에 해당하는지 확인한다.
 * @param {{ ig: import('ignore').Ignore }} ignoreRules
 * @param {string} relativePath - 프로젝트 루트 기준 상대 경로
 * @returns {boolean}
 */
function shouldIgnore(ignoreRules: IgnoreRules, relativePath: string): boolean {
  return ignoreRules.ig.ignores(relativePath);
}

export { DEFAULT_IGNORE_DIRS, loadIgnoreRules, shouldIgnore, toGlobIgnorePatterns };
