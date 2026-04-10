import fs from 'node:fs';
import path from 'node:path';
import type { ScanFramework } from '../types.js';
import { getFrameworkRules } from './detection-loader.js';

interface NpmRules {
  manifest: string;
  depsFields: string[];
  frameworks: Record<string, string>;
}

interface PipRules {
  manifests: string[];
  frameworks: Record<string, string>;
}

interface FrameworkRules {
  npm?: NpmRules;
  pip?: PipRules;
}

/**
 * `^`, `~`, `>=`, `<=`, `>`, `<`, `=`, 공백 등 버전 접두사 제거
 */
function cleanVersion(v: string | undefined): string | null {
  return v ? v.replace(/^[\^~>=<\s]+/, '') : null;
}

/**
 * 디렉토리에서 프레임워크를 감지한다.
 * @param {string} targetPath 절대 경로
 * @returns {{ name: string, version: string|null, source: string }[]}
 */
function detectFrameworks(targetPath: string): ScanFramework[] {
  const rules = getFrameworkRules() as FrameworkRules;
  const results: ScanFramework[] = [];

  // npm 감지 (package.json)
  if (rules.npm) {
    const pkgPath = path.join(targetPath, rules.npm.manifest);
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as Record<string, Record<string, string> | undefined>;
        const allDeps: Record<string, string> = {};
        for (const field of rules.npm.depsFields) {
          Object.assign(allDeps, pkg[field] || {});
        }
        for (const [pkgName, displayName] of Object.entries(rules.npm.frameworks)) {
          if (allDeps[pkgName] !== undefined) {
            results.push({
              name: displayName,
              version: cleanVersion(allDeps[pkgName]),
              source: rules.npm.manifest,
            });
          }
        }
      } catch {
        // 파싱 실패 무시
      }
    }
  }

  // pip 감지 (requirements.txt + pyproject.toml)
  if (rules.pip) {
    for (const manifest of rules.pip.manifests) {
      const manifestPath = path.join(targetPath, manifest);
      if (!fs.existsSync(manifestPath)) continue;

      if (manifest === 'requirements.txt') {
        const lines = fs.readFileSync(manifestPath, 'utf8').split('\n');
        for (const line of lines) {
          const trimmed = line.trim().toLowerCase();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const [pkgRaw] = trimmed.split(/[>=<!]/);
          const pkg = pkgRaw.trim();
          if (rules.pip.frameworks[pkg]) {
            const versionMatch = line.match(/[>=]=?\s*([\d.]+)/);
            results.push({
              name: rules.pip.frameworks[pkg],
              version: versionMatch ? versionMatch[1] : null,
              source: manifest,
            });
          }
        }
      } else if (manifest === 'pyproject.toml') {
        try {
          const content = fs.readFileSync(manifestPath, 'utf8');
          for (const [pkgName, displayName] of Object.entries(rules.pip.frameworks)) {
            const regex = new RegExp(`["']${pkgName}[>=<\\[\\s"']`, 'i');
            if (regex.test(content)) {
              results.push({ name: displayName, version: null, source: manifest });
            }
          }
        } catch {
          // 파싱 실패 무시
        }
      }
    }
  }

  // go.mod
  const goModPath = path.join(targetPath, 'go.mod');
  if (fs.existsSync(goModPath)) {
    const content = fs.readFileSync(goModPath, 'utf8');
    const match = content.match(/^module\s+(\S+)/m);
    if (match) {
      results.push({ name: match[1], version: null, source: 'go.mod' });
    }
  }

  // Cargo.toml
  const cargoPath = path.join(targetPath, 'Cargo.toml');
  if (fs.existsSync(cargoPath)) {
    const content = fs.readFileSync(cargoPath, 'utf8');
    const match = content.match(/^\[package\][^[]*name\s*=\s*"([^"]+)"/ms);
    if (match) {
      results.push({ name: match[1], version: null, source: 'Cargo.toml' });
    }
  }

  return results;
}

export { detectFrameworks };
