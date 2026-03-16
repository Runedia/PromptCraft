'use strict';

const path = require('path');
const { scan } = require('../src/core/scanner');
const { ScanError } = require('../src/shared/errors');

const FIXTURE = path.join(__dirname, 'fixtures', 'sample-project');

describe('scanner', () => {
  let result;

  beforeAll(async () => {
    result = await scan(FIXTURE);
  });

  test('언어 감지: JavaScript와 TypeScript 포함', () => {
    const names = result.languages.map((l) => l.name);
    expect(names).toContain('JavaScript');
    expect(names).toContain('TypeScript');
  });

  test('언어 감지: percentage 합계가 100에 가까움', () => {
    const total = result.languages.reduce((s, l) => s + l.percentage, 0);
    expect(total).toBeCloseTo(100, 0);
  });

  test('프레임워크 감지: Express와 React 포함', () => {
    const names = result.frameworks.map((f) => f.name);
    expect(names).toContain('Express');
    expect(names).toContain('React');
  });

  test('구조 트리: node_modules 미포함', () => {
    const childNames = result.structure.children.map((c) =>
      typeof c === 'string' ? c : c.name
    );
    expect(childNames).not.toContain('node_modules');
  });

  test('패키지 매니저: pnpm 반환', () => {
    expect(result.packageManager).toBe('pnpm');
  });

  test('hasEnv: true 반환', () => {
    expect(result.hasEnv).toBe(true);
  });

  test('.env 내용이 결과에 포함되지 않음', () => {
    const json = JSON.stringify(result);
    expect(json).not.toContain('super-secret-value');
    expect(json).not.toContain('DATABASE_URL');
  });

  test('configFiles: package.json 포함', () => {
    expect(result.configFiles).toContain('package.json');
  });

  test('scannedAt: ISO8601 형식', () => {
    expect(() => new Date(result.scannedAt)).not.toThrow();
    expect(result.scannedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  test('ScanError: 존재하지 않는 경로', async () => {
    await expect(scan('/nonexistent/path/xyz')).rejects.toThrow(ScanError);
  });

  test('성능: 스캔 5초 이하', async () => {
    const start = Date.now();
    await scan(FIXTURE);
    expect(Date.now() - start).toBeLessThan(5000);
  });
});
