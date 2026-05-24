import { describe, expect, test } from 'bun:test';
import { buildArgv } from '../../../src/core/run/shells.js';

describe('buildArgv', () => {
  test('cmd(기본): start로 새 cmd 창 + /k', () => {
    expect(buildArgv('cmd', {}, ['claude'], 'C:/p')).toEqual(['cmd.exe', '/c', 'start', '', 'cmd', '/k', 'claude']);
  });

  test('cmd: 다중 launch 토큰 전개', () => {
    expect(buildArgv('cmd', {}, ['gh', 'copilot'], 'C:/p')).toEqual(['cmd.exe', '/c', 'start', '', 'cmd', '/k', 'gh', 'copilot']);
  });

  test('powershell: -NoExit -Command 문자열', () => {
    expect(buildArgv('powershell', {}, ['claude'], 'C:/p')).toEqual(['cmd.exe', '/c', 'start', '', 'powershell', '-NoExit', '-Command', 'claude']);
  });

  test('pwsh: -NoExit -Command, launch join', () => {
    expect(buildArgv('pwsh', {}, ['gh', 'copilot'], 'C:/p')).toEqual(['cmd.exe', '/c', 'start', '', 'pwsh', '-NoExit', '-Command', 'gh copilot']);
  });

  test('미존재 셸 id → cmd 폴백', () => {
    expect(buildArgv('zsh', {}, ['claude'], 'C:/p')).toEqual(['cmd.exe', '/c', 'start', '', 'cmd', '/k', 'claude']);
  });

  test('config override 템플릿: {cwd}/{launch} 치환', () => {
    const overrides = { wt: { argsTemplate: ['wt.exe', '-d', '{cwd}', 'cmd', '/k', '{launch}'] } };
    expect(buildArgv('wt', overrides, ['claude'], 'C:/proj')).toEqual(['wt.exe', '-d', 'C:/proj', 'cmd', '/k', 'claude']);
  });

  test('override가 빌트인 id를 덮어쓴다', () => {
    const overrides = { cmd: { argsTemplate: ['custom.exe', '{launch}'] } };
    expect(buildArgv('cmd', overrides, ['claude'], 'C:/p')).toEqual(['custom.exe', 'claude']);
  });
});
