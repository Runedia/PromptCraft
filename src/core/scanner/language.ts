import fs from 'node:fs';
import path from 'node:path';
import type { IgnoreRules, ScanLanguage } from '../types.js';
import { getLanguageMap } from './detection-loader.js';
import { DEFAULT_IGNORE_DIR_SET, shouldIgnore } from './gitignore.js';

type LangRole = 'primary' | 'template' | 'config';
type LanguageMap = ReturnType<typeof getLanguageMap>;

/**
 * 디렉토리 트리를 단일 동기 walk로 순회하며 알려진 확장자별 파일 수를 집계한다.
 *
 * 기존 258-확장자 brace glob(picomatch 컴파일·전 경로 매칭) 대신 readdirSync + EXTENSION_MAP O(1) 조회를 쓴다.
 * I/O(디렉토리 순회)는 동일하나 거대 alternation 매칭 비용과 전체 파일 경로 배열 물질화를 제거한다.
 *
 * ignore 판정은 기존 동작과 동일하다:
 * - ignoreRules가 있으면 권위 소스인 shouldIgnore(`ignore` 라이브러리)로 디렉토리 가지치기 + 파일 필터.
 * - 없으면 DEFAULT_IGNORE_DIR_SET로 기본 디렉토리만 가지치기(파일 필터 없음).
 * 상대 경로는 '/' 구분자로 누적해 cross-platform에서 ignore 매칭이 정확하다.
 */
function collectExtensionCounts(targetPath: string, extensionMap: LanguageMap, ignoreRules?: IgnoreRules): Record<string, number> {
  const counts: Record<string, number> = {};

  const walk = (dir: string, relDir: string): void => {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const relPath = relDir ? `${relDir}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        if (ignoreRules) {
          if (shouldIgnore(ignoreRules, relPath)) continue;
        } else if (DEFAULT_IGNORE_DIR_SET.has(entry.name)) {
          continue;
        }
        walk(path.join(dir, entry.name), relPath);
      } else {
        if (ignoreRules && shouldIgnore(ignoreRules, relPath)) continue;
        const ext = path.extname(entry.name).toLowerCase();
        if (extensionMap[ext]) {
          counts[ext] = (counts[ext] || 0) + 1;
        }
      }
    }
  };

  walk(targetPath, '');
  return counts;
}

/**
 * 디렉토리에서 언어별 파일 수를 집계한다.
 * - primary: 비율은 primary 합계 기준, 상위 5개 반환
 * - template/config: 존재하면 전부 반환 (비율은 해당 그룹 내 기준)
 */
function detectLanguages(targetPath: string, ignoreRules?: IgnoreRules): ScanLanguage[] {
  const EXTENSION_MAP = getLanguageMap();
  const counts = collectExtensionCounts(targetPath, EXTENSION_MAP, ignoreRules);

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
