import { describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { classifyDomain } from '../../../src/core/scanner/domain-classifier.js';
import { detectLanguages } from '../../../src/core/scanner/language.js';

// 확장자 → 언어명 매핑을 tmp 디렉토리에서 검증한다 (.gitignore 무관).
// primary는 상위 5개로 잘리므로(language.ts) 호출당 확장자 수를 5개 이하로 유지한다.
function scanExts(files: string[]): Record<string, string> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-ext-'));
  try {
    for (const name of files) {
      fs.writeFileSync(path.join(dir, name), 'x\n');
    }
    const langs = detectLanguages(dir);
    return Object.fromEntries(langs.map((l) => [l.extension, l.name]));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

describe('detectLanguages — 누락 확장자 정합', () => {
  test('React/헤더: .tsx → TypeScript, .jsx → JavaScript, .h → C', () => {
    const byExt = scanExts(['App.tsx', 'legacy.jsx', 'header.h']);
    expect(byExt['.tsx']).toBe('TypeScript');
    expect(byExt['.jsx']).toBe('JavaScript');
    expect(byExt['.h']).toBe('C');
  });

  test('신규 언어: .dart → Dart, .scala → Scala, .lua → Lua, .r → R', () => {
    const byExt = scanExts(['main.dart', 'Build.scala', 'script.lua', 'analysis.r']);
    expect(byExt['.dart']).toBe('Dart');
    expect(byExt['.scala']).toBe('Scala');
    expect(byExt['.lua']).toBe('Lua');
    expect(byExt['.r']).toBe('R');
  });

  test('Linguist 파생: .vue → Vue, .kts → Kotlin, .svelte → Svelte', () => {
    const byExt = scanExts(['App.vue', 'build.gradle.kts', 'Page.svelte']);
    expect(byExt['.vue']).toBe('Vue');
    expect(byExt['.kts']).toBe('Kotlin');
    expect(byExt['.svelte']).toBe('Svelte');
  });

  test('Vue 언어 힌트 → web-frontend 도메인 fallback', () => {
    const d = classifyDomain([], [{ name: 'Vue', extension: '.vue', count: 1, percentage: 100, role: 'primary' }]);
    expect(d.primary).toBe('web-frontend');
  });
});
