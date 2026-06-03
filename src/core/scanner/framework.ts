import fs from 'node:fs';
import path from 'node:path';
import { globSync } from 'tinyglobby';
import type { ScanFramework } from '../types.js';
import { getFrameworkRules } from './detection-loader.js';

interface FrameworkEntry {
  displayName: string;
  domain?: string;
  weight?: number;
}

interface EcosystemRule {
  id: string;
  parser: string;
  manifest?: string;
  manifests?: string[];
  depsFields?: string[];
  depsPattern?: string;
  frameworks: Record<string, FrameworkEntry | string>;
}

interface FrameworkRules {
  ecosystems: EcosystemRule[];
}

type ParserFn = (targetPath: string, eco: EcosystemRule) => ScanFramework[];

const _regexCache = new Map<string, RegExp>();
function getCachedRegex(pattern: string, flags = ''): RegExp {
  const key = `${flags}/${pattern}`;
  let re = _regexCache.get(key);
  if (!re) {
    re = new RegExp(pattern, flags);
    _regexCache.set(key, re);
  }
  return re;
}

// 스캔 1회 동안 매니페스트 파일 내용을 캐시한다(존재하지 않거나 읽기 실패 시 null 캐시).
// 16 ecosystem × 최대 30 candidate 루프에서 동일 매니페스트를 중복 존재확인·읽기하던 비용을 제거한다.
// detectFrameworks는 동기 함수라 단일 이벤트 루프에서 원자적으로 실행되므로 모듈 스코프 캐시 공유가 안전하다(진입 시 clear).
const _readCache = new Map<string, string | null>();
function readManifest(absPath: string): string | null {
  const cached = _readCache.get(absPath);
  if (cached !== undefined) return cached;
  let content: string | null;
  try {
    content = fs.readFileSync(absPath, 'utf8');
  } catch {
    content = null;
  }
  _readCache.set(absPath, content);
  return content;
}

// 루프 내부에서 재컴파일하던 리터럴 정규식을 모듈 상수로 호이스트한다.
// matchAll은 전역 정규식을 내부 복제하므로 공유 인스턴스의 lastIndex가 오염되지 않는다.
const TOML_DEP_LINE_RE = /^([\w-]+)\s*=/gm;
const YAML_PKG_LINE_RE = /^[ \t]+([\w-]+)\s*:/gm;

function cleanVersion(v: string | undefined): string | null {
  return v ? v.replace(/^[\^~>=<\s]+/, '') : null;
}

function toEntry(val: FrameworkEntry | string): FrameworkEntry {
  return typeof val === 'string' ? { displayName: val } : val;
}

function makeFw(entry: FrameworkEntry, version: string | null, source: string): ScanFramework {
  return { name: entry.displayName, version, source, domain: entry.domain, weight: entry.weight };
}

function parseJsonManifest(targetPath: string, eco: EcosystemRule): ScanFramework[] {
  const results: ScanFramework[] = [];
  const manifestFile = eco.manifest ?? 'package.json';
  const manifestPath = path.join(targetPath, manifestFile);
  const raw = readManifest(manifestPath);
  if (raw === null) return results;

  let pkg: Record<string, unknown>;
  try {
    pkg = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return results;
  }

  const fields = eco.depsFields ?? ['dependencies', 'devDependencies'];
  const allDeps: Record<string, string> = {};
  for (const field of fields) {
    const section = pkg[field];
    if (section && typeof section === 'object') {
      Object.assign(allDeps, section as Record<string, string>);
    }
  }

  for (const [pkgName, raw] of Object.entries(eco.frameworks)) {
    const entry = toEntry(raw);
    if (allDeps[pkgName] !== undefined) {
      results.push(makeFw(entry, cleanVersion(allDeps[pkgName]), manifestFile));
    }
  }
  return results;
}

function parseTextLines(targetPath: string, eco: EcosystemRule): ScanFramework[] {
  const results: ScanFramework[] = [];
  const manifests = eco.manifests ?? (eco.manifest ? [eco.manifest] : []);

  for (const manifestFile of manifests) {
    const manifestPath = path.join(targetPath, manifestFile);
    const content = readManifest(manifestPath);
    if (content === null) continue;

    if (manifestFile === 'pyproject.toml') {
      for (const [pkgName, raw] of Object.entries(eco.frameworks)) {
        const entry = toEntry(raw);
        const regex = getCachedRegex(`["']${pkgName}[>=<\\[\\s"']`, 'i');
        if (regex.test(content)) {
          results.push(makeFw(entry, null, manifestFile));
        }
      }
    } else {
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim().toLowerCase();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const [pkgRaw] = trimmed.split(/[>=<![\s]/);
        const pkg = pkgRaw.trim();
        const raw = eco.frameworks[pkg];
        if (raw !== undefined) {
          const entry = toEntry(raw);
          const versionMatch = line.match(/[>=]=?\s*([\d.]+)/);
          results.push(makeFw(entry, versionMatch ? versionMatch[1] : null, manifestFile));
        }
      }
    }
  }
  return results;
}

function parseGoMod(targetPath: string, eco: EcosystemRule): ScanFramework[] {
  const results: ScanFramework[] = [];
  const manifestPath = path.join(targetPath, 'go.mod');
  const content = readManifest(manifestPath);
  if (content === null) return results;

  const blockMatch = content.match(/require\s*\(([^)]+)\)/ms);
  const blockDeps = blockMatch ? blockMatch[1] : '';
  const singleReqs = content.match(/^require\s+(\S+)\s+([\S]+)/gm) ?? [];

  const lines: string[] = [...blockDeps.split('\n').map((l) => l.trim()), ...singleReqs.map((l) => l.replace(/^require\s+/, ''))];

  for (const line of lines) {
    if (!line || line.startsWith('//')) continue;
    const parts = line.trim().split(/\s+/);
    const modulePath = parts[0];
    const version = parts[1] ?? null;
    if (!modulePath) continue;

    const exactRaw = eco.frameworks[modulePath];
    if (exactRaw !== undefined) {
      results.push(makeFw(toEntry(exactRaw), cleanVersion(version ?? undefined), 'go.mod'));
      continue;
    }
    for (const [key, raw] of Object.entries(eco.frameworks)) {
      if (modulePath.startsWith(key)) {
        results.push(makeFw(toEntry(raw), cleanVersion(version ?? undefined), 'go.mod'));
        break;
      }
    }
  }

  return results;
}

function parseTomlDeps(targetPath: string, eco: EcosystemRule): ScanFramework[] {
  const results: ScanFramework[] = [];
  const manifestPath = path.join(targetPath, 'Cargo.toml');
  const content = readManifest(manifestPath);
  if (content === null) return results;

  const depSections = ['dependencies', 'dev-dependencies', 'build-dependencies'];
  const seen = new Set<string>();

  for (const section of depSections) {
    const sectionRegex = getCachedRegex(`\\[${section}\\]([^[]*)`, 'ms');
    const sectionMatch = content.match(sectionRegex);
    if (!sectionMatch) continue;

    const sectionContent = sectionMatch[1];
    for (const m of sectionContent.matchAll(TOML_DEP_LINE_RE)) {
      const crateName = m[1];
      if (seen.has(crateName)) continue;

      const raw = eco.frameworks[crateName];
      if (raw !== undefined) {
        seen.add(crateName);
        const versionMatch = sectionContent.slice(m.index).match(/["']([\d.]+)["']/);
        results.push(makeFw(toEntry(raw), versionMatch ? versionMatch[1] : null, 'Cargo.toml'));
      }
    }
  }

  return results;
}

function parseXmlManifest(targetPath: string, eco: EcosystemRule): ScanFramework[] {
  const results: ScanFramework[] = [];
  const seen = new Set<string>();

  const manifestGlob = eco.manifest ?? 'pom.xml';
  const isGlob = manifestGlob.includes('*');
  let manifestFiles: string[];

  if (isGlob) {
    manifestFiles = globSync(manifestGlob, { cwd: targetPath });
  } else {
    manifestFiles = fs.existsSync(path.join(targetPath, manifestGlob)) ? [manifestGlob] : [];
  }

  for (const manifestFile of manifestFiles) {
    const content = readManifest(path.join(targetPath, manifestFile));
    if (content === null) continue;

    for (const [key, raw] of Object.entries(eco.frameworks)) {
      if (seen.has(key)) continue;
      const entry = toEntry(raw);

      const patterns = [
        getCachedRegex(`<artifactId>\\s*[^<]*${key}[^<]*\\s*</artifactId>`, 'i'),
        getCachedRegex(`<PackageReference[^>]+Include\\s*=\\s*["'][^"']*${key}[^"']*["']`, 'i'),
      ];

      for (const pattern of patterns) {
        if (pattern.test(content)) {
          seen.add(key);
          results.push(makeFw(entry, null, manifestFile));
          break;
        }
      }
    }
  }

  return results;
}

function parseDslRegex(targetPath: string, eco: EcosystemRule): ScanFramework[] {
  const results: ScanFramework[] = [];
  const manifests = eco.manifests ?? (eco.manifest ? [eco.manifest] : []);
  if (!eco.depsPattern) return results;
  const pattern = getCachedRegex(eco.depsPattern, 'gm');

  for (const manifestFile of manifests) {
    const manifestPath = path.join(targetPath, manifestFile);
    const content = readManifest(manifestPath);
    if (content === null) continue;

    const matches: string[] = [];
    for (const m of content.matchAll(pattern)) {
      for (let i = 1; i < m.length; i++) {
        if (m[i]) matches.push(m[i]);
      }
    }

    for (const matchStr of matches) {
      for (const [key, raw] of Object.entries(eco.frameworks)) {
        if (matchStr.toLowerCase().includes(key.toLowerCase())) {
          results.push(makeFw(toEntry(raw), null, manifestFile));
          break;
        }
      }
    }
  }

  return results;
}

function parseSolutionFile(targetPath: string, eco: EcosystemRule): ScanFramework[] {
  const results: ScanFramework[] = [];
  const manifests = eco.manifests ?? (eco.manifest ? [eco.manifest] : []);
  const seen = new Set<string>();

  const manifestFiles: string[] = [];
  for (const pattern of manifests) {
    if (pattern.includes('*')) {
      manifestFiles.push(...globSync(pattern, { cwd: targetPath }));
    } else if (fs.existsSync(path.join(targetPath, pattern))) {
      manifestFiles.push(pattern);
    }
  }

  for (const manifestFile of manifestFiles) {
    // 내용은 사용하지 않고 읽기 가능 여부만 확인한다(해당 csproj가 존재하면 프레임워크로 간주).
    if (readManifest(path.join(targetPath, manifestFile)) === null) continue;

    for (const [key, raw] of Object.entries(eco.frameworks)) {
      if (seen.has(key)) continue;
      const entry = toEntry(raw);
      seen.add(key);
      results.push(makeFw(entry, null, manifestFile));
    }
  }

  return results;
}

function parseYamlDeps(targetPath: string, eco: EcosystemRule): ScanFramework[] {
  const results: ScanFramework[] = [];
  const manifestFile = eco.manifest ?? 'pubspec.yaml';
  const manifestPath = path.join(targetPath, manifestFile);
  const content = readManifest(manifestPath);
  if (content === null) return results;

  const fields = eco.depsFields ?? ['dependencies', 'dev_dependencies'];
  for (const field of fields) {
    const sectionRegex = getCachedRegex(`^${field}:\\s*\\n((?:[ \\t]+\\S[^\\n]*\\n)*)`, 'm');
    const sectionMatch = content.match(sectionRegex);
    if (!sectionMatch) continue;

    const sectionContent = sectionMatch[1];
    for (const m of sectionContent.matchAll(YAML_PKG_LINE_RE)) {
      const pkgName = m[1];
      const raw = eco.frameworks[pkgName];
      if (raw !== undefined) {
        results.push(makeFw(toEntry(raw), null, manifestFile));
      }
    }
  }

  return results;
}

const parsers: Record<string, ParserFn> = {
  json: parseJsonManifest,
  'text-lines': parseTextLines,
  'go-mod': parseGoMod,
  'toml-deps': parseTomlDeps,
  xml: parseXmlManifest,
  'dsl-regex': parseDslRegex,
  'yaml-deps': parseYamlDeps,
  'solution-file': parseSolutionFile,
};

/**
 * monorepo workspace 후보 디렉토리를 수집한다.
 * root를 포함하며 최대 MAX_CANDIDATES 개까지 반환한다.
 */
function collectCandidates(root: string): string[] {
  const MAX_CANDIDATES = 30;
  const candidates = new Set<string>([root]);

  const addGlobs = (patterns: string[]) => {
    for (const pattern of patterns) {
      try {
        const dirs = globSync(pattern, { cwd: root, onlyDirectories: true, deep: 3 });
        for (const d of dirs) {
          candidates.add(path.join(root, d));
          if (candidates.size >= MAX_CANDIDATES) return;
        }
      } catch {
        // glob 실패 무시
      }
    }
  };

  // package.json workspaces
  const pkgPath = path.join(root, 'package.json');
  const pkgRaw = readManifest(pkgPath);
  if (pkgRaw !== null) {
    try {
      const pkg = JSON.parse(pkgRaw) as Record<string, unknown>;
      const ws = pkg.workspaces;
      const patterns: string[] = Array.isArray(ws)
        ? ws
        : Array.isArray((ws as Record<string, unknown>)?.packages)
          ? (ws as Record<string, string[]>).packages
          : [];
      if (patterns.length > 0) addGlobs(patterns);
    } catch {
      // 파싱 실패 무시
    }
  }

  if (candidates.size >= MAX_CANDIDATES) return [...candidates].slice(0, MAX_CANDIDATES);

  // pnpm-workspace.yaml
  const pnpmWs = path.join(root, 'pnpm-workspace.yaml');
  const pnpmRaw = readManifest(pnpmWs);
  if (pnpmRaw !== null) {
    try {
      const patterns = [...pnpmRaw.matchAll(/^\s*-\s*['"]?([^'"#\n]+?)['"]?\s*$/gm)].map((m) => m[1].trim());
      if (patterns.length > 0) addGlobs(patterns);
    } catch {
      // 파싱 실패 무시
    }
  }

  if (candidates.size >= MAX_CANDIDATES) return [...candidates].slice(0, MAX_CANDIDATES);

  // Cargo workspace members
  const cargoPath = path.join(root, 'Cargo.toml');
  const cargoRaw = readManifest(cargoPath);
  if (cargoRaw !== null) {
    try {
      const wsMatch = cargoRaw.match(/\[workspace\][^[]*members\s*=\s*\[([^\]]+)\]/ms);
      if (wsMatch) {
        const members = [...wsMatch[1].matchAll(/["']([^"']+)["']/g)].map((m) => m[1]);
        addGlobs(members);
      }
    } catch {
      // 파싱 실패 무시
    }
  }

  if (candidates.size >= MAX_CANDIDATES) return [...candidates].slice(0, MAX_CANDIDATES);

  // settings.gradle(.kts) include ':module:sub'
  for (const settingsFile of ['settings.gradle', 'settings.gradle.kts']) {
    const settingsPath = path.join(root, settingsFile);
    const settingsRaw = readManifest(settingsPath);
    if (settingsRaw === null) continue;
    try {
      const modules = [...settingsRaw.matchAll(/include\s*[('"]([^'")\n]+)['"]/g)].map((m) => m[1].replace(/:/g, '/').replace(/^\//, ''));
      for (const mod of modules) {
        const absPath = path.join(root, mod);
        if (fs.existsSync(absPath)) candidates.add(absPath);
        if (candidates.size >= MAX_CANDIDATES) break;
      }
    } catch {
      // 파싱 실패 무시
    }
    break;
  }

  if (candidates.size >= MAX_CANDIDATES) return [...candidates].slice(0, MAX_CANDIDATES);

  // .sln / .slnx — csproj 디렉토리 추가
  const slnFiles = globSync('{*.sln,*.slnx}', { cwd: root });
  for (const slnFile of slnFiles) {
    const slnRaw = readManifest(path.join(root, slnFile));
    if (slnRaw === null) continue;
    try {
      const isSln = slnFile.endsWith('.sln');
      const pattern = isSln ? /Project\([^)]+\)\s*=\s*"[^"]+"\s*,\s*"([^"]+\.csproj)"/g : /<Project\s+Path="([^"]+\.csproj)"/g;
      for (const m of slnRaw.matchAll(pattern)) {
        const csprojDir = path.dirname(path.join(root, m[1].replace(/\\/g, '/')));
        if (fs.existsSync(csprojDir)) candidates.add(csprojDir);
        if (candidates.size >= MAX_CANDIDATES) break;
      }
    } catch {
      // 파싱 실패 무시
    }
    if (candidates.size >= MAX_CANDIDATES) break;
  }

  return [...candidates].slice(0, MAX_CANDIDATES);
}

/**
 * 디렉토리에서 프레임워크를 감지한다. monorepo workspace를 포함한다.
 * @param {string} targetPath 절대 경로
 */
function detectFrameworks(targetPath: string): ScanFramework[] {
  // 스캔 1회 단위로 매니페스트 읽기 캐시를 초기화한다(detectFrameworks는 동기 함수라 호출 간 간섭 없음).
  _readCache.clear();
  const rules = getFrameworkRules() as unknown as FrameworkRules;
  const results: ScanFramework[] = [];
  const candidates = collectCandidates(targetPath);

  for (const eco of rules.ecosystems) {
    const parserFn = parsers[eco.parser];
    if (!parserFn) continue;
    for (const candidate of candidates) {
      results.push(...parserFn(candidate, eco));
    }
  }

  return results;
}

export { detectFrameworks };
