import fs from 'node:fs';
import { config } from '../../core/db/index.js';
import { PROVIDERS, type RunTarget } from '../../core/run/providers.js';
import { buildArgv } from '../../core/run/shells.js';
import { resolveLaunchEnv } from './env.js';

/** provider 바이너리 설치 여부 (Bun.which) */
export function isInstalled(target: RunTarget): boolean {
  return Bun.which(PROVIDERS[target].bin) !== null;
}

/** 모든 provider 설치 여부 맵 */
export function providerAvailability(): Record<RunTarget, boolean> {
  const out = {} as Record<RunTarget, boolean>;
  for (const t of Object.keys(PROVIDERS) as RunTarget[]) out[t] = isInstalled(t);
  return out;
}

/** cwd가 존재하는 디렉토리인지 검증 */
export function isValidCwd(cwd: string): boolean {
  try {
    return !!cwd && fs.statSync(cwd).isDirectory();
  } catch {
    return false;
  }
}

/**
 * 새 터미널 창에서 provider CLI를 fire-and-forget 실행
 * 호출자(라우트)가 `isValidCwd`로 cwd를 사전 검증한 뒤 호출한다.
 */
export function launch(target: RunTarget, cwd: string): { launched: string } {
  const provider = PROVIDERS[target];
  const shellId = config.get('run.shell') ?? 'cmd';

  let overrides: Record<string, unknown> = {};
  const rawShells = config.get('run.shells');
  if (rawShells) {
    try {
      overrides = JSON.parse(rawShells) as Record<string, unknown>;
    } catch {
      overrides = {};
    }
  }

  const argv = buildArgv(shellId, overrides, provider.launch, cwd);
  const env = resolveLaunchEnv();
  const proc = Bun.spawn(argv, { cwd, env, stdio: ['ignore', 'ignore', 'ignore'] });
  proc.unref();
  return { launched: provider.bin };
}
