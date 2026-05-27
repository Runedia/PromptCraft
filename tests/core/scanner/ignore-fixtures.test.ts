import { describe, expect, test } from 'bun:test';
import path from 'node:path';
import { loadIgnoreRules } from '../../../src/core/scanner/gitignore.js';
import { detectLanguages } from '../../../src/core/scanner/language.js';

// fixtures/ 하위에 다른 언어 파일(zig, go)을 둔 프로젝트.
// 스캐너가 자기/사용자의 테스트 fixtures를 분석 대상에 넣어서는 안 된다.
const FIXTURE = path.resolve(import.meta.dir, '../../fixtures/with-fixtures-dir');

describe('detectLanguages — fixtures 디렉토리 제외', () => {
  test('ignoreRules 경로: fixtures/ 하위 파일은 언어 감지에서 제외된다', () => {
    const ignoreRules = loadIgnoreRules(FIXTURE);
    const names = detectLanguages(FIXTURE, ignoreRules).map((l) => l.name);

    expect(names).toContain('TypeScript');
    expect(names).not.toContain('Zig');
    expect(names).not.toContain('Go');
  });

  test('fallback 경로(ignoreRules 생략): fixtures/ 하위 파일은 제외된다', () => {
    const names = detectLanguages(FIXTURE).map((l) => l.name);

    expect(names).toContain('TypeScript');
    expect(names).not.toContain('Zig');
    expect(names).not.toContain('Go');
  });
});
