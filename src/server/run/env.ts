import { type EnvDict, mergeLaunchEnv } from '../../core/run/env.js';

/**
 * PowerShell 스크립트: Machine/User 환경변수를 ExpandEnvironmentVariables로 확장 후 JSON 반환.
 * 각 값을 명시 확장하므로 REG_EXPAND_SZ(%SystemRoot% 등) 자동 확장 여부에 의존하지 않는다.
 */
const PS_SCRIPT =
  `[Console]::OutputEncoding=[Text.Encoding]::UTF8;` +
  `$f={param($t)$h=[Environment]::GetEnvironmentVariables($t);$o=@{};foreach($k in $h.Keys){$o[$k]=[Environment]::ExpandEnvironmentVariables([string]$h[$k])};$o};` +
  `[pscustomobject]@{machine=(&$f 'Machine');user=(&$f 'User')}|ConvertTo-Json -Compress -Depth 3`;

/**
 * launch 시점의 최신 시스템+사용자 환경변수를 해석한다.
 * 어떤 실패(부재/비정상 종료/파싱 오류/예외)든 process.env로 graceful 폴백 → 기존 동작(부모 상속) 유지.
 */
export function resolveLaunchEnv(): EnvDict {
  const base = process.env as Record<string, string | undefined>;
  const fallback = (): EnvDict => {
    const out: EnvDict = {};
    for (const [k, v] of Object.entries(base)) if (v != null) out[k] = v;
    return out;
  };
  try {
    const r = Bun.spawnSync(['powershell', '-NoProfile', '-NonInteractive', '-Command', PS_SCRIPT]);
    if (!r.success || r.exitCode !== 0) return fallback();
    const text = new TextDecoder().decode(r.stdout).trim();
    if (!text) return fallback();
    const parsed = JSON.parse(text) as { machine?: EnvDict; user?: EnvDict };
    if (!parsed || typeof parsed !== 'object' || !parsed.machine || !parsed.user) return fallback();
    return mergeLaunchEnv(base, parsed.machine, parsed.user);
  } catch {
    return fallback();
  }
}
