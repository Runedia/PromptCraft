import { describe, expect, test } from 'bun:test';
import { mergeLaunchEnv } from '../../../src/core/run/env.js';

describe('mergeLaunchEnv()', () => {
  test('PATH는 Machine 먼저 User 뒤로 결합', () => {
    const out = mergeLaunchEnv({}, { Path: 'C:\\m' }, { Path: 'C:\\u' });
    expect(out.Path).toBe('C:\\m;C:\\u');
  });

  test('일반 변수는 User가 Machine을 덮어씀', () => {
    const out = mergeLaunchEnv({}, { FOO: 'm' }, { FOO: 'u' });
    expect(out.FOO).toBe('u');
  });

  test('base 고유 변수(레지스트리에 없음)는 보존', () => {
    const out = mergeLaunchEnv({ SYSTEMROOT: 'C:\\Windows' }, { Path: 'C:\\m' }, {});
    expect(out.SYSTEMROOT).toBe('C:\\Windows');
  });

  test('User PATH가 없으면 Machine PATH만', () => {
    const out = mergeLaunchEnv({}, { Path: 'C:\\m' }, {});
    expect(out.Path).toBe('C:\\m');
  });

  test('base의 대문자 PATH 키는 제거되고 Path 단일 키로 정규화', () => {
    const out = mergeLaunchEnv({ PATH: 'C:\\old' }, { Path: 'C:\\m' }, { Path: 'C:\\u' });
    expect(out.PATH).toBeUndefined();
    expect(out.Path).toBe('C:\\m;C:\\u');
  });

  test('Machine/User 모두 PATH가 없으면 base PATH 유지', () => {
    const out = mergeLaunchEnv({ Path: 'C:\\base' }, { FOO: 'm' }, { BAR: 'u' });
    expect(out.Path).toBe('C:\\base');
  });
});
