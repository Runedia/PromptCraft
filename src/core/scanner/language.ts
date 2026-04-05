import path from 'node:path';
import { globSync } from 'glob';
import type { IgnoreRules, ScanLanguage } from '../types.js';
import { shouldIgnore, toGlobIgnorePatterns } from './gitignore.js';

const EXTENSION_MAP = {
  '.js': 'JavaScript',
  '.ts': 'TypeScript',
  '.py': 'Python',
  '.java': 'Java',
  '.go': 'Go',
  '.rs': 'Rust',
  '.cpp': 'C++',
  '.cc': 'C++',
  '.c': 'C',
  '.cs': 'C#',
  '.rb': 'Ruby',
  '.php': 'PHP',
  '.swift': 'Swift',
  '.kt': 'Kotlin',
};
const KNOWN_EXTENSIONS = Object.keys(EXTENSION_MAP).map((ext) => ext.slice(1));
const LANGUAGE_GLOB = `**/*.{${KNOWN_EXTENSIONS.join(',')}}`;

/**
 * 디렉토리에서 언어별 파일 수를 집계해 상위 5개를 반환한다.
 * @param {string} targetPath 절대 경로
 * @param {object} [ignoreRules] loadIgnoreRules() 반환값. 미제공 시 기본 제외 목록 사용.
 * @returns {{ name: string, extension: string, count: number, percentage: number }[]}
 */
function detectLanguages(targetPath: string, ignoreRules?: IgnoreRules): ScanLanguage[] {
  const globIgnore = ignoreRules
    ? toGlobIgnorePatterns(ignoreRules)
    : [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/build/**',
        '**/.cache/**',
        '**/.gradle/**',
        '**/.idea/**',
        '**/.vscode/**',
        '**/.claude/**',
      ];

  let files = globSync(LANGUAGE_GLOB, {
    cwd: targetPath,
    nodir: true,
    ignore: globIgnore,
  });

  if (ignoreRules) {
    files = files.filter((f) => !shouldIgnore(ignoreRules, f));
  }

  const counts: Record<string, number> = {};
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!EXTENSION_MAP[ext]) continue;
    counts[ext] = (counts[ext] || 0) + 1;
  }

  const total = Object.values(counts).reduce((s, n) => s + n, 0);
  if (total === 0) return [];

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([ext, count]) => ({
      name: EXTENSION_MAP[ext as keyof typeof EXTENSION_MAP],
      extension: ext,
      count,
      percentage: Math.round((count / total) * 1000) / 10,
    }));
}

export { detectLanguages };
