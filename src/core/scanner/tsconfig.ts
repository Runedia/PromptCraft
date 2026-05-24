import fs from 'node:fs';
import path from 'node:path';
import type { TsCompilerConstraints } from '../types.js';

const WHITELIST_BOOL = ['strict', 'strictNullChecks', 'noImplicitAny', 'noUncheckedIndexedAccess', 'verbatimModuleSyntax'] as const;
const WHITELIST_STR = ['module', 'target', 'jsx'] as const;

/** 문자열 리터럴을 인식하며 라인 및 블록 주석을 제거한다. */
function stripJsonComments(input: string): string {
  let out = '';
  let inString = false;
  let inLine = false;
  let inBlock = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    const next = input[i + 1];
    if (inLine) {
      if (ch === '\n') {
        inLine = false;
        out += ch;
      }
      continue;
    }
    if (inBlock) {
      if (ch === '*' && next === '/') {
        inBlock = false;
        i++;
      }
      continue;
    }
    if (inString) {
      out += ch;
      if (ch === '\\') {
        out += next ?? '';
        i++;
        continue;
      }
      if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      out += ch;
      continue;
    }
    if (ch === '/' && next === '/') {
      inLine = true;
      i++;
      continue;
    }
    if (ch === '/' && next === '*') {
      inBlock = true;
      i++;
      continue;
    }
    out += ch;
  }
  return out;
}

/** } 또는 ] 직전의 trailing comma를 제거한다(주석 제거 후 호출). */
function stripTrailingCommas(input: string): string {
  return input.replace(/,(\s*[}\]])/g, '$1');
}

/**
 * tsconfig.json 원문에서 화이트리스트 컴파일러 옵션만 추출한다.
 * 파싱 실패·옵션 없음·화이트리스트 0건이면 undefined.
 */
export function parseTsConfigContent(raw: string): TsCompilerConstraints | undefined {
  let parsed: { compilerOptions?: Record<string, unknown> };
  try {
    parsed = JSON.parse(stripTrailingCommas(stripJsonComments(raw)));
  } catch {
    return undefined;
  }
  const co = parsed?.compilerOptions;
  if (!co || typeof co !== 'object') return undefined;

  const result: TsCompilerConstraints = {};
  for (const key of WHITELIST_BOOL) {
    if (co[key] === true) result[key] = true;
  }
  for (const key of WHITELIST_STR) {
    const v = co[key];
    if (typeof v === 'string' && v.length > 0) result[key] = v;
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

/** 디렉터리의 tsconfig.json을 읽어 화이트리스트 제약을 추출한다. 없거나 실패 시 undefined. */
export function extractTsConfig(dirPath: string): TsCompilerConstraints | undefined {
  const tsconfigPath = path.join(dirPath, 'tsconfig.json');
  if (!fs.existsSync(tsconfigPath)) return undefined;
  let raw: string;
  try {
    raw = fs.readFileSync(tsconfigPath, 'utf8');
  } catch {
    return undefined;
  }
  return parseTsConfigContent(raw);
}
