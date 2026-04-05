import fs from 'node:fs';
import path from 'node:path';
import type { IgnoreRules, ScanStructureNode } from '../types.js';
import { shouldIgnore } from './gitignore.js';

const FALLBACK_EXCLUDE_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.cache',
  '.next',
  'coverage',
  '.gradle',
  '.idea',
  '.vscode',
  '.claude',
]);

/**
 * 재귀적으로 디렉토리 트리를 빌드한다.
 * @param {string} dirPath
 * @param {number} currentDepth
 * @param {number} maxDepth - 탐색 최대 깊이 (기본값 2)
 * @param {object} [ignoreRules] - loadIgnoreRules() 반환값
 * @param {string} [rootPath] - 프로젝트 루트 (상대 경로 계산용)
 * @returns {{ name: string, children: Array<string|object> }}
 */
function buildStructure(
  dirPath: string,
  currentDepth: number,
  maxDepth = 2,
  ignoreRules?: IgnoreRules,
  rootPath?: string
): ScanStructureNode {
  const name = path.basename(dirPath);
  const children: Array<string | ScanStructureNode> = [];

  let entries: import('node:fs').Dirent[];
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return { name, children };
  }

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (ignoreRules && rootPath) {
        const relativePath = path.relative(rootPath, path.join(dirPath, entry.name));
        if (shouldIgnore(ignoreRules, relativePath)) continue;
      } else {
        if (FALLBACK_EXCLUDE_DIRS.has(entry.name)) continue;
      }

      if (currentDepth < maxDepth) {
        children.push(
          buildStructure(
            path.join(dirPath, entry.name),
            currentDepth + 1,
            maxDepth,
            ignoreRules,
            rootPath
          )
        );
      } else {
        children.push({ name: entry.name, children: [] });
      }
    } else {
      children.push(entry.name);
    }
  }

  return { name, children };
}

/**
 * 대상 경로의 디렉토리 트리를 반환한다.
 * @param {string} targetPath
 * @param {number} [maxDepth=2] - 탐색 최대 깊이
 * @param {object} [ignoreRules] - loadIgnoreRules() 반환값
 */
function buildTree(targetPath: string, maxDepth = 2, ignoreRules?: IgnoreRules): ScanStructureNode {
  return buildStructure(targetPath, 0, maxDepth, ignoreRules, targetPath);
}

export { buildTree };
