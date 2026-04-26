import { describe, expect, test } from 'bun:test';
import path from 'node:path';
import { detectFrameworks } from '../../../src/core/scanner/framework.js';

const FIXTURES = path.resolve(import.meta.dir, '../../fixtures/scanner');

describe('detectFrameworks — monorepo workspace 탐색', () => {
  test('pnpm workspaces: packages/lib/package.json의 react 감지', () => {
    const frameworks = detectFrameworks(path.join(FIXTURES, 'monorepo-pnpm'));
    const names = frameworks.map((f) => f.name);
    expect(names).toContain('React');
  });

  test('Cargo workspace: crates/core/Cargo.toml의 clap 감지', () => {
    const frameworks = detectFrameworks(path.join(FIXTURES, 'monorepo-cargo'));
    const names = frameworks.map((f) => f.name);
    expect(names).toContain('Clap');
  });

  test('pnpm monorepo: root만 있는 경우 빈 결과 아님 (root도 포함)', () => {
    const frameworks = detectFrameworks(path.join(FIXTURES, 'monorepo-pnpm'));
    expect(frameworks.length).toBeGreaterThan(0);
  });
});
