import { describe, expect, test } from 'bun:test';
import { classifyDomain } from '../../../src/core/scanner/domain-classifier.js';
import type { ScanFramework, ScanLanguage } from '../../../src/core/types.js';

const noLangs: ScanLanguage[] = [];

function fw(domain: string, weight?: number): ScanFramework {
  return { name: 'test', version: null, source: 'test', domain, weight };
}

describe('classifyDomain — weight 기반 임계값', () => {
  test('weight 1.0 단일 프레임워크 → high', () => {
    const result = classifyDomain([fw('mobile', 1.0)], noLangs);
    expect(result.primary).toBe('mobile');
    expect(result.confidence).toBe('high');
  });

  test('weight 0.4 단일 라이브러리(NumPy only) → low, 언어 fallback', () => {
    const result = classifyDomain([fw('data-ml', 0.4)], noLangs);
    expect(result.confidence).toBe('low');
  });

  test('weight 0.4 + 0.4 합산 0.8 → medium', () => {
    const result = classifyDomain([fw('data-ml', 0.4), fw('data-ml', 0.4)], noLangs);
    expect(result.primary).toBe('data-ml');
    expect(result.confidence).toBe('medium');
  });

  test('PyTorch(1.0) + NumPy(0.4) 합산 1.4 → high (단일 도메인 >= 1.0)', () => {
    const result = classifyDomain([fw('data-ml', 1.0), fw('data-ml', 0.4)], noLangs);
    expect(result.primary).toBe('data-ml');
    expect(result.confidence).toBe('high');
  });

  test('PyTorch(1.0) + TF(1.0) 합산 2.0 → high', () => {
    const result = classifyDomain([fw('data-ml', 1.0), fw('data-ml', 1.0)], noLangs);
    expect(result.primary).toBe('data-ml');
    expect(result.confidence).toBe('high');
  });

  test('Flutter(1.0) 단독 → high', () => {
    const result = classifyDomain([fw('mobile', 1.0)], noLangs);
    expect(result.primary).toBe('mobile');
    expect(result.confidence).toBe('high');
  });

  test('Electron(1.0) 단독 → high', () => {
    const result = classifyDomain([fw('desktop', 1.0)], noLangs);
    expect(result.primary).toBe('desktop');
    expect(result.confidence).toBe('high');
  });

  test('sln(0.6) + Avalonia(1.0) 합산 1.6, 단일 도메인 desktop → high', () => {
    const result = classifyDomain([fw('desktop', 0.6), fw('desktop', 1.0)], noLangs);
    expect(result.primary).toBe('desktop');
    expect(result.confidence).toBe('high');
  });

  test('testing 도메인은 primary에서 제외', () => {
    const result = classifyDomain([fw('testing', 1.0), fw('web-backend', 1.0)], noLangs);
    expect(result.primary).toBe('web-backend');
    expect(result.secondary).toBeNull();
  });

  test('두 도메인 비율 >= 0.5 → medium + secondary', () => {
    const result = classifyDomain([fw('web-frontend', 1.0), fw('web-backend', 1.0)], noLangs);
    expect(result.confidence).toBe('medium');
    expect(result.secondary).not.toBeNull();
  });
});
