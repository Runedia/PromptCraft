import path from 'node:path';
import { globSync } from 'tinyglobby';
import type { IgnoreRules, ScanLanguage } from '../types.js';
import { shouldIgnore, toGlobIgnorePatterns } from './gitignore.js';

type LangRole = 'primary' | 'template' | 'config';

const EXTENSION_MAP: Record<string, { name: string; role: LangRole }> = {
  '.js': { name: 'JavaScript', role: 'primary' },
  '.ts': { name: 'TypeScript', role: 'primary' },
  '.py': { name: 'Python', role: 'primary' },
  '.java': { name: 'Java', role: 'primary' },
  '.go': { name: 'Go', role: 'primary' },
  '.rs': { name: 'Rust', role: 'primary' },
  '.cpp': { name: 'C++', role: 'primary' },
  '.cc': { name: 'C++', role: 'primary' },
  '.c': { name: 'C', role: 'primary' },
  '.cs': { name: 'C#', role: 'primary' },
  '.rb': { name: 'Ruby', role: 'primary' },
  '.php': { name: 'PHP', role: 'primary' },
  '.swift': { name: 'Swift', role: 'primary' },
  '.kt': { name: 'Kotlin', role: 'primary' },
  '.jsp': { name: 'JSP', role: 'template' },
  '.xml': { name: 'XML', role: 'config' },
};
const KNOWN_EXTENSIONS = Object.keys(EXTENSION_MAP).map((ext) => ext.slice(1));
const LANGUAGE_GLOB = `**/*.{${KNOWN_EXTENSIONS.join(',')}}`;

/**
 * 디렉토리에서 언어별 파일 수를 집계한다.
 * - primary: 비율은 primary 합계 기준, 상위 5개 반환
 * - template/config: 존재하면 전부 반환 (비율은 해당 그룹 내 기준)
 */
function detectLanguages(targetPath: string, ignoreRules?: IgnoreRules): ScanLanguage[] {
  const globIgnore = ignoreRules
    ? toGlobIgnorePatterns(ignoreRules)
    : ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**', '**/.cache/**', '**/.gradle/**', '**/.idea/**', '**/.vscode/**', '**/.claude/**'];

  let files = globSync(LANGUAGE_GLOB, {
    cwd: targetPath,
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

  if (Object.keys(counts).length === 0) return [];

  // 역할별로 분리
  const byRole: Record<LangRole, Array<[string, number]>> = {
    primary: [],
    template: [],
    config: [],
  };
  for (const [ext, count] of Object.entries(counts)) {
    const role = EXTENSION_MAP[ext].role;
    byRole[role].push([ext, count]);
  }

  const toEntries = (pairs: Array<[string, number]>, role: LangRole): ScanLanguage[] => {
    const total = pairs.reduce((s, [, n]) => s + n, 0);
    return pairs
      .sort((a, b) => b[1] - a[1])
      .map(([ext, count]) => ({
        name: EXTENSION_MAP[ext].name,
        extension: ext,
        count,
        percentage: Math.round((count / total) * 1000) / 10,
        role,
      }));
  };

  const primary = toEntries(byRole.primary, 'primary').slice(0, 5);
  const template = toEntries(byRole.template, 'template');
  const config = toEntries(byRole.config, 'config');

  return [...primary, ...template, ...config];
}

export { detectLanguages };
