'use strict';

const { globSync } = require('glob');
const path = require('path');

const EXTENSION_MAP = {
  '.js': 'JavaScript',
  '.ts': 'TypeScript',
  '.py': 'Python',
  '.java': 'Java',
  '.go': 'Go',
  '.rs': 'Rust',
  '.cpp': 'C++',
  '.cc': 'C++',
  '.c': 'C++',
  '.cs': 'C#',
  '.rb': 'Ruby',
  '.php': 'PHP',
  '.swift': 'Swift',
  '.kt': 'Kotlin',
};

/**
 * 디렉토리에서 언어별 파일 수를 집계해 상위 5개를 반환한다.
 * @param {string} targetPath 절대 경로
 * @returns {{ name: string, extension: string, count: number, percentage: number }[]}
 */
function detectLanguages(targetPath) {
  const files = globSync('**/*.*', {
    cwd: targetPath,
    nodir: true,
    ignore: [
      '**/node_modules/**', //
      '**/.git/**',
      '**/dist/**',
      '**/build/**',
      '**/.cache/**',
      '**/.gradle/**',
      '**/.idea/**',
      '**/.vscode/**',
      '**/.claude/**',
    ]
    ,
  });

  const counts = {};
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
      name: EXTENSION_MAP[ext],
      extension: ext,
      count,
      percentage: Math.round((count / total) * 1000) / 10,
    }));
}

module.exports = { detectLanguages };
