import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadIgnoreRules } from '../../../src/core/scanner/gitignore.js';
import { detectLanguages } from '../../../src/core/scanner/language.js';

// 언어별 의존성/빌드 산출물 디렉토리는 node_modules와 동일하게 제외되어야 한다.
// .gitignore 충돌(target/vendor/.venv 등)을 피하려고 런타임 tmp 디렉토리를 쓴다.
let root: string;

const NOISE: Record<string, string> = {
  '.venv/lib/dep.py': 'x = 1\n', // Python 가상환경
  'venv/dep.py': 'x = 1\n',
  'vendor/dep.go': 'package v\n', // Go/PHP/Ruby 공유
  'target/gen.rs': 'fn main() {}\n', // Rust/Maven
  'Pods/Lib.swift': 'let x = 1\n', // Swift CocoaPods
  '.build/gen.swift': 'let x = 1\n', // Swift SPM
  'obj/Gen.cs': 'class G {}\n', // .NET
  '.nuxt/app.js': 'export default 1\n', // JS 메타프레임워크 산출물
  '.svelte-kit/gen.ts': 'export const a = 1\n',
  '.output/server.js': 'export default 2\n',
  '.turbo/cache.ts': 'export const b = 2\n',
};

beforeAll(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-scan-dep-'));
  fs.mkdirSync(path.join(root, 'src'), { recursive: true });
  fs.writeFileSync(path.join(root, 'src', 'index.ts'), 'export const x = 1;\n');
  for (const [rel, content] of Object.entries(NOISE)) {
    const p = path.join(root, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, content);
  }
});

afterAll(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe('detectLanguages — 의존성/산출물 디렉토리 제외', () => {
  test('fallback 경로: src/index.ts만 집계 (TypeScript 1건)', () => {
    const langs = detectLanguages(root);
    expect(langs).toHaveLength(1);
    expect(langs[0].name).toBe('TypeScript');
    expect(langs[0].count).toBe(1);
  });

  test('ignoreRules 경로: src/index.ts만 집계 (TypeScript 1건)', () => {
    const langs = detectLanguages(root, loadIgnoreRules(root));
    expect(langs).toHaveLength(1);
    expect(langs[0].name).toBe('TypeScript');
    expect(langs[0].count).toBe(1);
  });
});
