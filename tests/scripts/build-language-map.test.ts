import { describe, expect, test } from 'bun:test';
import { buildLanguageMap } from '../../scripts/build-language-map.js';

// Linguist languages.yml 파싱 결과를 모사한 최소 입력.
const YAML = {
  JavaScript: { type: 'programming', extensions: ['.js', '.mjs', '.cjs', '.jsx'] },
  TypeScript: { type: 'programming', extensions: ['.ts', '.cts', '.mts'] },
  TSX: { type: 'programming', extensions: ['.tsx'] },
  C: { type: 'programming', extensions: ['.c', '.h'] },
  'C++': { type: 'programming', extensions: ['.cpp', '.cc', '.h'] },
  Rust: { type: 'programming', extensions: ['.rs'] },
  Kotlin: { type: 'programming', extensions: ['.kt', '.kts'] },
  Vue: { type: 'markup', extensions: ['.vue'] },
  XML: { type: 'data', extensions: ['.xml', '.ts', '.rs'] },
  PHP: { type: 'programming', extensions: ['.php', '.inc'] },
  Brainfuck: { type: 'programming', extensions: ['.bf'] }, // 화이트리스트 밖
};

describe('buildLanguageMap', () => {
  test('화이트리스트 언어만 포함, 밖은 제외', () => {
    const map = buildLanguageMap(YAML);
    expect(map['.js']).toEqual({ name: 'JavaScript', role: 'primary' });
    expect(map['.vue']).toEqual({ name: 'Vue', role: 'primary' });
    expect(map['.bf']).toBeUndefined();
  });

  test('TSX는 TypeScript로 병합', () => {
    const map = buildLanguageMap(YAML);
    expect(map['.tsx']).toEqual({ name: 'TypeScript', role: 'primary' });
  });

  test('충돌 우선순위: .ts→TypeScript, .rs→Rust, .h→C (XML/C++ 아님)', () => {
    const map = buildLanguageMap(YAML);
    expect(map['.ts'].name).toBe('TypeScript');
    expect(map['.rs'].name).toBe('Rust');
    expect(map['.h'].name).toBe('C');
  });

  test('모호 충돌 확장자(.inc)는 제외', () => {
    const map = buildLanguageMap(YAML);
    expect(map['.inc']).toBeUndefined();
  });

  test('manual override: .zon, .jsp', () => {
    const map = buildLanguageMap(YAML);
    expect(map['.zon']).toEqual({ name: 'Zig Object Notation', role: 'config' });
    expect(map['.jsp']).toEqual({ name: 'JSP', role: 'template' });
  });

  test('data type 언어는 config role (XML)', () => {
    const map = buildLanguageMap(YAML);
    expect(map['.xml']).toEqual({ name: 'XML', role: 'config' });
  });

  test('복합 확장자(.zig.zon 등)는 드롭 — path.extname 매칭 불가', () => {
    const map = buildLanguageMap({
      Zig: { type: 'programming', extensions: ['.zig', '.zig.zon'] },
      'C#': { type: 'programming', extensions: ['.cs', '.cs.pp'] },
    });
    expect(map['.zig']).toEqual({ name: 'Zig', role: 'primary' });
    expect(map['.zig.zon']).toBeUndefined();
    expect(map['.cs']).toEqual({ name: 'C#', role: 'primary' });
    expect(map['.cs.pp']).toBeUndefined();
  });
});
