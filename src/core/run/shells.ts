/** 빌트인 셸: launch 토큰 → 최종 spawn argv (새 콘솔 창) */
export interface ShellProfile {
  buildArgs: (launch: string[]) => string[];
}

/** config 사용자 정의 셸: {launch}/{cwd} 토큰 템플릿 */
export interface ShellTemplate {
  argsTemplate: string[];
}

export const DEFAULT_SHELL = 'cmd';

/** 새 콘솔 창은 `cmd.exe /c start ""` 로 띄우고 내부 셸이 launch를 실행한다. */
export const BUILTIN_SHELLS: Record<string, ShellProfile> = {
  cmd: { buildArgs: (l) => ['cmd.exe', '/c', 'start', '', 'cmd', '/k', ...l] },
  powershell: { buildArgs: (l) => ['cmd.exe', '/c', 'start', '', 'powershell', '-NoExit', '-Command', l.join(' ')] },
  pwsh: { buildArgs: (l) => ['cmd.exe', '/c', 'start', '', 'pwsh', '-NoExit', '-Command', l.join(' ')] },
};

function isTemplate(v: unknown): v is ShellTemplate {
  return !!v && typeof v === 'object' && Array.isArray((v as ShellTemplate).argsTemplate);
}

/**
 * 활성 셸의 최종 Bun.spawn argv를 만든다.
 * 우선순위: config override(템플릿) > 빌트인 > cmd 폴백.
 * launch 토큰은 PROVIDERS의 고정 문자열(공백 없음)이며, override 템플릿 작성은 사용자 책임(셸 이스케이프 없음).
 */
export function buildArgv(shellId: string, overrides: Record<string, unknown>, launch: string[], cwd: string): string[] {
  const override = overrides[shellId];
  if (isTemplate(override)) {
    return override.argsTemplate.map((tok) => tok.replaceAll('{launch}', launch.join(' ')).replaceAll('{cwd}', cwd));
  }
  const profile = BUILTIN_SHELLS[shellId] ?? BUILTIN_SHELLS[DEFAULT_SHELL];
  return profile.buildArgs(launch);
}
