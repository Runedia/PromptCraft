'use strict';

const { listPresets, loadPreset } = require('../src/core/prompt/presets');

describe('preset loader', () => {
  test('트리별 프리셋 목록을 반환한다', () => {
    const presets = listPresets('error-solving');
    expect(Array.isArray(presets)).toBe(true);
    expect(presets.length).toBeGreaterThanOrEqual(5);
  });

  test('preset id로 프리셋 로드가 가능하다', () => {
    const preset = loadPreset('fi-01-rest-api-endpoint');
    expect(preset.treeId).toBe('feature-impl');
    expect(preset.examples[0].prefill.implScope).toBeTruthy();
  });
});
