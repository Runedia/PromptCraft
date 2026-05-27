import fs from 'node:fs';
import path from 'node:path';
import ignore from 'ignore';
import type { IgnoreRules } from '../types.js';

/**
 * 항상 제외할 기본 디렉토리 (gitignore 유무와 무관).
 * scanner 전반(language/structure/configFiles)의 단일 ignore 소스 — 개별 모듈은 별도 목록을 두지 않는다.
 * 원칙: 언어별 의존성·빌드 산출물 디렉토리는 node_modules와 동일하게 제외한다 (그 안의 소스가 언어 카운트를 왜곡).
 * 제외 보류: bin/out 은 실제 소스 디렉토리와 이름이 충돌하므로 넣지 않는다 (.gitignore에 위임).
 */
const DEFAULT_IGNORE_DIRS = [
  // VCS·에디터·범용 캐시
  '.git',
  '.cache',
  '.idea',
  '.vscode',
  '.claude',
  // JS/TS: 의존성·빌드 산출물·메타프레임워크 산출물
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.next',
  '.nuxt',
  '.svelte-kit',
  '.output',
  '.turbo',
  // Python: 가상환경(site-packages)
  '.venv',
  'venv',
  // Go/PHP/Ruby: 의존성 vendor 디렉토리
  'vendor',
  // Rust/Maven: 빌드 산출물(생성 소스 포함)
  'target',
  // Java/Kotlin (Gradle)
  '.gradle',
  // C#/.NET: 빌드 중간물(생성 .cs)
  'obj',
  // Swift: CocoaPods 의존성 / SPM 빌드
  'Pods',
  '.build',
  // Zig: 빌드 캐시·산출물·의존성
  '.zig-cache',
  'zig-cache',
  'zig-out',
  'zig-pkg',
  // 테스트 fixtures (다른 언어 더미 샘플 — 분석 노이즈)
  'fixtures',
  '__fixtures__',
];

/** DEFAULT_IGNORE_DIRS를 빠른 조회용 Set으로 노출 (basename 단위 매칭). */
const DEFAULT_IGNORE_DIR_SET = new Set(DEFAULT_IGNORE_DIRS);

/** glob용 기본 ignore 패턴 배열 (`**\/dir/**`). ignoreRules가 없는 호출 경로의 공통 fallback. */
function defaultGlobIgnore(): string[] {
  return DEFAULT_IGNORE_DIRS.map((dir) => `**/${dir}/**`);
}

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
  let rawPatterns: string[] = [];

  if (fs.existsSync(gitignorePath)) {
    try {
      const content = fs.readFileSync(gitignorePath, 'utf8');
      ig.add(content);
      source = 'gitignore';
      rawPatterns = content
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith('#'));
    } catch {
      // 읽기 실패 시 기본 규칙만 사용
    }
  }

  return { ig, source, rawPatterns };
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
  // 부정 패턴(!)은 picomatch에 전달하지 않음 — JS 레벨 shouldIgnore가 안전망 역할
  const gitignorePatterns = (ignoreRules.rawPatterns ?? []).filter((p) => !p.startsWith('!'));
  return [...defaultGlobIgnore(), ...gitignorePatterns];
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

export { DEFAULT_IGNORE_DIR_SET, DEFAULT_IGNORE_DIRS, defaultGlobIgnore, loadIgnoreRules, shouldIgnore, toGlobIgnorePatterns };
