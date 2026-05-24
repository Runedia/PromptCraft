import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test';
import os from 'node:os';
import * as connection from '../../../src/core/db/connection.js';
import { config } from '../../../src/core/db/index.js';
import { isValidCwd, launch, providerAvailability } from '../../../src/server/run/launcher.js';

let spawnSyncSpy: ReturnType<typeof spyOn>;

beforeEach(() => {
  connection.initialize(':memory:');
  // resolveLaunchEnv 내부 PowerShell 호출을 차단 → 폴백(process.env) 경로로 동작
  spawnSyncSpy = spyOn(Bun, 'spawnSync').mockReturnValue({
    success: false,
    exitCode: 1,
    stdout: new Uint8Array(),
    stderr: new Uint8Array(),
  } as never);
});

afterEach(() => {
  spawnSyncSpy.mockRestore();
  connection.closeConnection();
});

describe('launch()', () => {
  test('기본 셸(cmd)로 새 창 spawn + cwd + env 전달', () => {
    let unrefCalls = 0;
    const spawnSpy = spyOn(Bun, 'spawn').mockReturnValue({
      unref() {
        unrefCalls++;
      },
    } as unknown as never);
    const res = launch('claude-code', os.tmpdir());
    expect(res.launched).toBe('claude');
    expect(spawnSpy).toHaveBeenCalledTimes(1);
    const [argv, opts] = spawnSpy.mock.calls[0];
    expect(argv).toEqual(['cmd.exe', '/c', 'start', '', 'cmd', '/k', 'claude']);
    expect((opts as { cwd: string }).cwd).toBe(os.tmpdir());
    expect((opts as { env: Record<string, string> }).env).toBeDefined();
    expect(unrefCalls).toBe(1);
    spawnSpy.mockRestore();
  });

  test('config run.shell=powershell 반영', () => {
    config.set('run.shell', 'powershell');
    const spawnSpy = spyOn(Bun, 'spawn').mockReturnValue({ unref() {} } as unknown as never);
    launch('claude-code', os.tmpdir());
    expect(spawnSpy.mock.calls[0][0]).toEqual(['cmd.exe', '/c', 'start', '', 'powershell', '-NoExit', '-Command', 'claude']);
    spawnSpy.mockRestore();
  });

  test('config run.shells 템플릿 override 반영', () => {
    config.set('run.shell', 'wt');
    config.set('run.shells', JSON.stringify({ wt: { argsTemplate: ['wt.exe', '-d', '{cwd}', 'cmd', '/k', '{launch}'] } }));
    const spawnSpy = spyOn(Bun, 'spawn').mockReturnValue({ unref() {} } as unknown as never);
    launch('codex', 'C:/proj');
    expect(spawnSpy.mock.calls[0][0]).toEqual(['wt.exe', '-d', 'C:/proj', 'cmd', '/k', 'codex']);
    spawnSpy.mockRestore();
  });

  test('run.shells가 깨진 JSON이면 빌트인 폴백', () => {
    config.set('run.shells', '{ broken');
    const spawnSpy = spyOn(Bun, 'spawn').mockReturnValue({ unref() {} } as unknown as never);
    launch('gemini', os.tmpdir());
    expect(spawnSpy.mock.calls[0][0]).toEqual(['cmd.exe', '/c', 'start', '', 'cmd', '/k', 'gemini']);
    spawnSpy.mockRestore();
  });
});

describe('isValidCwd()', () => {
  test('존재하는 디렉토리 → true', () => expect(isValidCwd(os.tmpdir())).toBe(true));
  test('빈 문자열 → false', () => expect(isValidCwd('')).toBe(false));
  test('존재하지 않는 경로 → false', () => expect(isValidCwd('C:/__nope__/zzz')).toBe(false));
});

describe('providerAvailability()', () => {
  test('which 결과를 provider 맵으로 반환', () => {
    const whichSpy = spyOn(Bun, 'which').mockImplementation((bin: string) => (bin === 'claude' ? '/x/claude' : null));
    const avail = providerAvailability();
    expect(avail['claude-code']).toBe(true);
    expect(avail.gemini).toBe(false);
    whichSpy.mockRestore();
  });
});
