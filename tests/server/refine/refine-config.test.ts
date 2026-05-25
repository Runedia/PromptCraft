import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import * as connection from '../../../src/core/db/connection.js';
import { config } from '../../../src/core/db/index.js';
import { getRefineConfig } from '../../../src/server/refine/config.js';

beforeEach(() => connection.initialize(':memory:'));
afterEach(() => connection.closeConnection());

describe('getRefineConfig', () => {
  test('빈 DB → 기본값', () => {
    expect(getRefineConfig()).toEqual({ baseUrl: 'http://localhost:1234/v1', model: null, apiKey: '', threshold: 50 });
  });

  test('저장값이 기본값을 덮어쓴다', () => {
    config.set('refine.baseUrl', 'http://localhost:8000/v1');
    config.set('refine.model', 'gemma-4-E4B-it');
    config.set('refine.threshold', '70');
    const c = getRefineConfig();
    expect(c.baseUrl).toBe('http://localhost:8000/v1');
    expect(c.model).toBe('gemma-4-E4B-it');
    expect(c.threshold).toBe(70);
  });

  test('threshold 비정상 값 → 기본 50으로 폴백', () => {
    config.set('refine.threshold', 'abc');
    expect(getRefineConfig().threshold).toBe(50);
  });

  test('model 빈 문자열 → null', () => {
    config.set('refine.model', '');
    expect(getRefineConfig().model).toBeNull();
  });

  test('model 공백만 → null', () => {
    config.set('refine.model', '   ');
    expect(getRefineConfig().model).toBeNull();
  });

  test("threshold '0' → 0 (항상 다듬기, 유효값)", () => {
    config.set('refine.threshold', '0');
    expect(getRefineConfig().threshold).toBe(0);
  });
});
