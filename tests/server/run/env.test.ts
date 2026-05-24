import { afterEach, describe, expect, spyOn, test } from 'bun:test';
import { resolveLaunchEnv } from '../../../src/server/run/env.js';

function mockSpawnSync(over: Partial<{ success: boolean; exitCode: number; stdout: Uint8Array; stderr: Uint8Array }>) {
  return spyOn(Bun, 'spawnSync').mockReturnValue({
    success: true,
    exitCode: 0,
    stdout: new Uint8Array(),
    stderr: new Uint8Array(),
    ...over,
  } as never);
}

afterEach(() => {
  // 각 테스트가 자체 spy를 mockRestore 한다
});

describe('resolveLaunchEnv()', () => {
  test('정상 JSON이면 머지 결과 반환 (PATH 결합)', () => {
    const json = JSON.stringify({ machine: { Path: 'C:\\m' }, user: { Path: 'C:\\u' } });
    const spy = mockSpawnSync({ stdout: new TextEncoder().encode(json) });
    const env = resolveLaunchEnv();
    expect(env.Path).toBe('C:\\m;C:\\u');
    spy.mockRestore();
  });

  test('exitCode≠0이면 process.env 폴백', () => {
    const spy = mockSpawnSync({ success: false, exitCode: 1 });
    const env = resolveLaunchEnv();
    expect(env).toEqual({ ...process.env } as Record<string, string>);
    spy.mockRestore();
  });

  test('깨진 JSON이면 process.env 폴백', () => {
    const spy = mockSpawnSync({ stdout: new TextEncoder().encode('{ broken') });
    const env = resolveLaunchEnv();
    expect(env).toEqual({ ...process.env } as Record<string, string>);
    spy.mockRestore();
  });

  test('machine/user 키 누락이면 폴백', () => {
    const spy = mockSpawnSync({ stdout: new TextEncoder().encode('{"machine":{"Path":"x"}}') });
    const env = resolveLaunchEnv();
    expect(env).toEqual({ ...process.env } as Record<string, string>);
    spy.mockRestore();
  });

  test('spawnSync가 throw하면 폴백', () => {
    const spy = spyOn(Bun, 'spawnSync').mockImplementation(() => {
      throw new Error('boom');
    });
    const env = resolveLaunchEnv();
    expect(env).toEqual({ ...process.env } as Record<string, string>);
    spy.mockRestore();
  });
});
