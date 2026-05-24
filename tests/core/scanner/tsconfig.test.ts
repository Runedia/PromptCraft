import { describe, expect, test } from 'bun:test';
import path from 'node:path';
import { scan } from '../../../src/core/scanner/index.js';
import { extractTsConfig, parseTsConfigContent } from '../../../src/core/scanner/tsconfig.js';

describe('parseTsConfigContent — 화이트리스트 추출', () => {
  test('strict만 설정되면 strict:true만 추출', () => {
    const raw = '{ "compilerOptions": { "strict": true } }';
    expect(parseTsConfigContent(raw)).toEqual({ strict: true });
  });

  test('개별 플래그(strict 없음)는 각각 추출', () => {
    const raw = '{ "compilerOptions": { "strictNullChecks": true, "noUncheckedIndexedAccess": true } }';
    expect(parseTsConfigContent(raw)).toEqual({ strictNullChecks: true, noUncheckedIndexedAccess: true });
  });

  test('문자열 옵션(module/target/jsx)을 추출', () => {
    const raw = '{ "compilerOptions": { "module": "ESNext", "target": "ES2022", "jsx": "react-jsx" } }';
    expect(parseTsConfigContent(raw)).toEqual({ module: 'ESNext', target: 'ES2022', jsx: 'react-jsx' });
  });

  test('화이트리스트 외 키는 무시', () => {
    const raw = '{ "compilerOptions": { "outDir": "dist", "sourceMap": true, "strict": true } }';
    expect(parseTsConfigContent(raw)).toEqual({ strict: true });
  });

  test('boolean 옵션이 false면 추출하지 않음', () => {
    const raw = '{ "compilerOptions": { "strict": false } }';
    expect(parseTsConfigContent(raw)).toBeUndefined();
  });

  test('라인/블록 주석을 무시', () => {
    const raw = `{
      // 라인 주석
      "compilerOptions": {
        /* 블록 주석 */
        "strict": true
      }
    }`;
    expect(parseTsConfigContent(raw)).toEqual({ strict: true });
  });

  test('trailing comma 허용', () => {
    const raw = '{ "compilerOptions": { "strict": true, }, }';
    expect(parseTsConfigContent(raw)).toEqual({ strict: true });
  });

  test('문자열 리터럴 내 //를 주석으로 오인하지 않음', () => {
    const raw = '{ "compilerOptions": { "target": "ES2022" }, "include": ["src//deep"] }';
    expect(parseTsConfigContent(raw)).toEqual({ target: 'ES2022' });
  });

  test('extends가 있어도 최상위 명시 옵션만 추출(base 미머지)', () => {
    const raw = '{ "extends": "./base.json", "compilerOptions": { "target": "ES2022" } }';
    expect(parseTsConfigContent(raw)).toEqual({ target: 'ES2022' });
  });

  test('깨진 JSON이면 undefined', () => {
    expect(parseTsConfigContent('{ not valid')).toBeUndefined();
  });

  test('compilerOptions가 없으면 undefined', () => {
    expect(parseTsConfigContent('{ "files": [] }')).toBeUndefined();
  });

  test('화이트리스트 키가 0개면 undefined', () => {
    expect(parseTsConfigContent('{ "compilerOptions": { "outDir": "dist" } }')).toBeUndefined();
  });
});

const FIXTURES = path.resolve(import.meta.dir, '../../fixtures/scanner');

describe('extractTsConfig — 파일 I/O', () => {
  test('tsconfig-strict fixture에서 화이트리스트 추출', () => {
    const result = extractTsConfig(path.join(FIXTURES, 'tsconfig-strict'));
    expect(result).toEqual({ strict: true, module: 'ESNext', target: 'ES2022', verbatimModuleSyntax: true });
  });

  test('tsconfig.json이 없는 디렉터리는 undefined', () => {
    const result = extractTsConfig(path.join(FIXTURES, 'zig-bare'));
    expect(result).toBeUndefined();
  });
});

describe('scan() — tsCompilerConstraints 주입', () => {
  test('tsconfig-strict fixture를 스캔하면 ScanResult에 제약이 담긴다', async () => {
    const result = await scan(path.join(FIXTURES, 'tsconfig-strict'));
    expect(result.tsCompilerConstraints).toEqual({ strict: true, module: 'ESNext', target: 'ES2022', verbatimModuleSyntax: true });
  });
});
