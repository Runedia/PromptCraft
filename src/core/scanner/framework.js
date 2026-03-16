'use strict';

const fs = require('fs');
const path = require('path');

const KNOWN_NPM_FRAMEWORKS = {
  'express': 'Express',
  'react': 'React',
  'vue': 'Vue',
  'next': 'Next.js',
  'nuxt': 'Nuxt.js',
  '@nestjs/core': 'NestJS',
  'vite': 'Vite',
  'jest': 'Jest',
  'vitest': 'Vitest',
};

const KNOWN_PYTHON_FRAMEWORKS = {
  'fastapi': 'FastAPI',
  'django': 'Django',
  'flask': 'Flask',
};

/**
 * `^`, `~`, `>=`, `<=`, `>`, `<`, `=`, 공백 등 버전 접두사 제거
 */
function cleanVersion(v) {
  return v ? v.replace(/^[\^~>=<\s]+/, '') : null;
}

/**
 * 디렉토리에서 프레임워크를 감지한다.
 * @param {string} targetPath 절대 경로
 * @returns {{ name: string, version: string|null, source: string }[]}
 */
function detectFrameworks(targetPath) {
  const results = [];

  // package.json
  const pkgPath = path.join(targetPath, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      for (const [pkgName, displayName] of Object.entries(KNOWN_NPM_FRAMEWORKS)) {
        if (allDeps[pkgName] !== undefined) {
          results.push({ name: displayName, version: cleanVersion(allDeps[pkgName]), source: 'package.json' });
        }
      }
    } catch {
      // 파싱 실패 무시
    }
  }

  // requirements.txt
  const reqPath = path.join(targetPath, 'requirements.txt');
  if (fs.existsSync(reqPath)) {
    const lines = fs.readFileSync(reqPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim().toLowerCase();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [pkgRaw] = trimmed.split(/[>=<!]/);
      const pkg = pkgRaw.trim();
      if (KNOWN_PYTHON_FRAMEWORKS[pkg]) {
        const versionMatch = line.match(/[>=]=?\s*([\d.]+)/);
        results.push({
          name: KNOWN_PYTHON_FRAMEWORKS[pkg],
          version: versionMatch ? versionMatch[1] : null,
          source: 'requirements.txt',
        });
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

module.exports = { detectFrameworks };
