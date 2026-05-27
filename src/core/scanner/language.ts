import path from 'node:path';
import { globSync } from 'tinyglobby';
import type { IgnoreRules, ScanLanguage } from '../types.js';
import { getLanguageMap } from './detection-loader.js';
import { defaultGlobIgnore, shouldIgnore, toGlobIgnorePatterns } from './gitignore.js';

type LangRole = 'primary' | 'template' | 'config';

/**
 * 디렉토리에서 언어별 파일 수를 집계한다.
 * - primary: 비율은 primary 합계 기준, 상위 5개 반환
 * - template/config: 존재하면 전부 반환 (비율은 해당 그룹 내 기준)
 */
function detectLanguages(targetPath: string, ignoreRules?: IgnoreRules): ScanLanguage[] {
  const EXTENSION_MAP = getLanguageMap();
  const knownExtensions = Object.keys(EXTENSION_MAP).map((ext) => ext.slice(1));
  const LANGUAGE_GLOB = `**/*.{${knownExtensions.join(',')}}`;

  const globIgnore = ignoreRules ? toGlobIgnorePatterns(ignoreRules) : defaultGlobIgnore();

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
