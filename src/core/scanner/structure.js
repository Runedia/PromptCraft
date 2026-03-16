'use strict';

const fs = require('fs');
const path = require('path');

const EXCLUDE_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.cache', '.next', 'coverage', '.gradle', '.idea', '.vscode', '.claude'
]);

/**
 * 재귀적으로 디렉토리 트리를 빌드한다.
 * @param {string} dirPath
 * @param {number} currentDepth
 * @param {number} maxDepth - 탐색 최대 깊이 (기본값 2)
 * @returns {{ name: string, children: Array<string|object> }}
 */
function buildStructure(dirPath, currentDepth, maxDepth = 2) {
  const name = path.basename(dirPath);
  const children = [];

  let entries;
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return { name, children };
  }

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry.name)) continue;
      if (currentDepth < maxDepth) {
        children.push(buildStructure(path.join(dirPath, entry.name), currentDepth + 1, maxDepth));
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
 */
function buildTree(targetPath, maxDepth = 2) {
  return buildStructure(targetPath, 0, maxDepth);
}

module.exports = { buildTree };
