import { describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import { type RoleMappings, resolveRoleSuggestions } from '../../../src/core/builder/role-resolver.js';
import type { ScanResult } from '../../../src/core/types.js';

const TREES_DIR = path.resolve(import.meta.dir, '../../../data/trees');

interface TreeFile {
  id: string;
  roleSuffix?: string;
}

function loadAllTrees(): TreeFile[] {
  return fs
    .readdirSync(TREES_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(TREES_DIR, f), 'utf8')) as TreeFile);
}

const MAPPINGS_PATH = path.resolve(import.meta.dir, '../../../data/role-mappings.json');
const REAL_MAPPINGS = JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf8')) as RoleMappings;

const SCAN: ScanResult = {
  path: '/tmp/fixture',
  languages: [{ name: 'TypeScript', extension: '.ts', count: 10, percentage: 100, role: 'primary' }],
  frameworks: [{ name: 'React', version: null, source: 'package.json' }],
  structure: { name: 'root', children: [] },
  packageManager: 'pnpm',
  hasEnv: false,
  configFiles: [],
  ignoreSource: 'gitignore',
  scannedAt: '2026-05-24T00:00:00.000Z',
  domainContext: { primary: 'web-frontend', secondary: null, confidence: 'high' },
} as unknown as ScanResult;

describe('roleSuffix 일관성 — 5개 트리 모두 정의되어야 함', () => {
  test('모든 트리가 roleSuffix 필드를 보유한다', () => {
    const trees = loadAllTrees();
    for (const tree of trees) {
      expect(tree.roleSuffix, `tree ${tree.id} missing roleSuffix`).toBeDefined();
      expect(tree.roleSuffix?.trim().length).toBeGreaterThan(0);
    }
  });

  test('각 트리에서 [Framework] [roleSuffix] 조합 역할이 1번 슬롯에 prepend된다', () => {
    const trees = loadAllTrees();
    for (const tree of trees) {
      const result = resolveRoleSuggestions(SCAN, tree.id, REAL_MAPPINGS, tree.roleSuffix).map((o) => o.value);
      expect(result[0], `tree ${tree.id} slot 0 mismatch`).toBe(`React ${tree.roleSuffix}`);
    }
  });

  test('각 트리에서 [Language] [roleSuffix] 조합 역할이 2번 슬롯에 들어간다', () => {
    const trees = loadAllTrees();
    for (const tree of trees) {
      const result = resolveRoleSuggestions(SCAN, tree.id, REAL_MAPPINGS, tree.roleSuffix).map((o) => o.value);
      expect(result[1], `tree ${tree.id} slot 1 mismatch`).toBe(`TypeScript ${tree.roleSuffix}`);
    }
  });
});

describe('roleSuffix 어휘 통일 — 전문가/멘토 패턴', () => {
  test('expected roleSuffix 값 (PRD 2.5 §3.2.3 일관성)', () => {
    const expected: Record<string, string> = {
      'error-solving': '디버깅 전문가',
      'feature-impl': '기능 구현 전문가',
      'code-review': '코드 리뷰 전문가',
      refactoring: '리팩토링 전문가',
      'concept-learn': '기술 멘토',
    };
    const trees = loadAllTrees();
    for (const tree of trees) {
      expect(tree.roleSuffix, `tree ${tree.id} roleSuffix`).toBe(expected[tree.id]);
    }
  });
});
