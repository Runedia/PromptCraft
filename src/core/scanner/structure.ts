import type { Dirent } from 'node:fs';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import type { IgnoreRules, ScanStructureNode } from '../types.js';
import { shouldIgnore } from './gitignore.js';

const FALLBACK_EXCLUDE_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.cache', '.next', 'coverage', '.gradle', '.idea', '.vscode', '.claude']);

/**
 * 재귀적으로 디렉토리 트리를 비동기 빌드한다.
 * 같은 depth의 하위 디렉토리는 Promise.all로 병렬 처리된다.
 */
async function buildStructure(dirPath: string, currentDepth: number, maxDepth = 2, ignoreRules?: IgnoreRules, rootPath?: string): Promise<ScanStructureNode> {
  const name = path.basename(dirPath);
  const children: Array<string | ScanStructureNode> = [];

  let entries: Dirent[];
  try {
    entries = await readdir(dirPath, { withFileTypes: true });
  } catch {
    return { name, children };
  }

  const subdirTasks: Promise<ScanStructureNode>[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (ignoreRules && rootPath) {
        const relativePath = path.relative(rootPath, path.join(dirPath, entry.name));
        if (shouldIgnore(ignoreRules, relativePath)) continue;
      } else {
        if (FALLBACK_EXCLUDE_DIRS.has(entry.name)) continue;
      }

      if (currentDepth < maxDepth) {
        subdirTasks.push(buildStructure(path.join(dirPath, entry.name), currentDepth + 1, maxDepth, ignoreRules, rootPath));
      } else {
        children.push({ name: entry.name, children: [] });
      }
    } else {
      children.push(entry.name);
    }
  }

  // 같은 depth의 하위 디렉토리를 병렬로 처리
  const subdirs = await Promise.all(subdirTasks);
  children.push(...subdirs);

  return { name, children };
}

/**
 * 대상 경로의 디렉토리 트리를 반환한다.
 * @param {string} targetPath
 * @param {number} [maxDepth=2]
 * @param {object} [ignoreRules]
 */
async function buildTree(targetPath: string, maxDepth = 2, ignoreRules?: IgnoreRules): Promise<ScanStructureNode> {
  return buildStructure(targetPath, 0, maxDepth, ignoreRules, targetPath);
}

export { buildTree };
