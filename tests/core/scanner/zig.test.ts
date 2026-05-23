import { describe, expect, test } from 'bun:test';
import path from 'node:path';
import { classifyDomain } from '../../../src/core/scanner/domain-classifier.js';
import { detectFrameworks } from '../../../src/core/scanner/framework.js';
import { loadIgnoreRules } from '../../../src/core/scanner/gitignore.js';
import { detectLanguages } from '../../../src/core/scanner/language.js';

const FIXTURES = path.resolve(import.meta.dir, '../../fixtures/scanner');

describe('detectLanguages — Zig 확장자', () => {
  test('zig-app: Zig가 primary, .zon이 config role', () => {
    const ignoreRules = loadIgnoreRules(path.join(FIXTURES, 'zig-app'));
    const langs = detectLanguages(path.join(FIXTURES, 'zig-app'), ignoreRules);

    const zig = langs.find((l) => l.extension === '.zig');
    expect(zig).toBeDefined();
    expect(zig?.name).toBe('Zig');
    expect(zig?.role).toBe('primary');

    const zon = langs.find((l) => l.extension === '.zon');
    expect(zon).toBeDefined();
    expect(zon?.role).toBe('config');
  });
});

describe('detectFrameworks — Zig ecosystem (build.zig.zon)', () => {
  test('zig-app: zigwin32 + mach 감지', () => {
    const frameworks = detectFrameworks(path.join(FIXTURES, 'zig-app'));
    const names = frameworks.map((f) => f.name);
    expect(names).toContain('zigwin32');
    expect(names).toContain('mach');
  });

  test('zig-app: zigwin32 domain은 desktop', () => {
    const frameworks = detectFrameworks(path.join(FIXTURES, 'zig-app'));
    const win32 = frameworks.find((f) => f.name === 'zigwin32');
    expect(win32?.domain).toBe('desktop');
    expect(win32?.source).toBe('build.zig.zon');
  });

  test('zig-bare: build.zig만 있고 zon 없음 — framework 0건', () => {
    const frameworks = detectFrameworks(path.join(FIXTURES, 'zig-bare'));
    expect(frameworks).toHaveLength(0);
  });
});

describe('classifyDomain — Zig fallback', () => {
  test('zig-bare: framework 0건이면 Zig 언어 hint → systems', () => {
    const domain = classifyDomain([], [{ name: 'Zig', extension: '.zig', count: 1, percentage: 100, role: 'primary' }]);
    expect(domain.primary).toBe('systems');
    expect(domain.confidence).toBe('low');
  });

  test('zigwin32 framework가 있으면 desktop 우선', () => {
    const domain = classifyDomain(
      [{ name: 'zigwin32', version: null, source: 'build.zig.zon', domain: 'desktop' }],
      [{ name: 'Zig', extension: '.zig', count: 5, percentage: 100, role: 'primary' }]
    );
    expect(domain.primary).toBe('desktop');
  });
});
