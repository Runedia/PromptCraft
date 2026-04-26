import { describe, expect, test } from 'bun:test';
import path from 'node:path';
import { detectFrameworks } from '../../../src/core/scanner/framework.js';

const FIXTURES = path.resolve(import.meta.dir, '../../fixtures/scanner');

describe('detectFrameworks — .sln 처리 및 wasm-bindgen', () => {
  test('.sln: Visual Studio Solution 프레임워크 감지', () => {
    const frameworks = detectFrameworks(path.join(FIXTURES, 'sln-csharp'));
    const names = frameworks.map((f) => f.name);
    expect(names).toContain('Visual Studio Solution');
  });

  test('.sln: domain이 desktop', () => {
    const frameworks = detectFrameworks(path.join(FIXTURES, 'sln-csharp'));
    const sln = frameworks.find((f) => f.name === 'Visual Studio Solution');
    expect(sln?.domain).toBe('desktop');
  });

  test('.sln: csproj 탐색으로 Avalonia 감지', () => {
    const frameworks = detectFrameworks(path.join(FIXTURES, 'sln-csharp'));
    const names = frameworks.map((f) => f.name);
    expect(names).toContain('Avalonia');
  });

  test('Cargo.toml wasm-bindgen 감지', () => {
    const frameworks = detectFrameworks(path.join(FIXTURES, 'cargo-wasm'));
    const names = frameworks.map((f) => f.name);
    expect(names).toContain('wasm-bindgen');
  });

  test('wasm-bindgen domain: web-frontend', () => {
    const frameworks = detectFrameworks(path.join(FIXTURES, 'cargo-wasm'));
    const wb = frameworks.find((f) => f.name === 'wasm-bindgen');
    expect(wb?.domain).toBe('web-frontend');
  });

  test('web-sys 감지', () => {
    const frameworks = detectFrameworks(path.join(FIXTURES, 'cargo-wasm'));
    const names = frameworks.map((f) => f.name);
    expect(names).toContain('web-sys');
  });
});
