export type RunTarget = 'claude-code' | 'gemini' | 'copilot' | 'codex';

export interface ProviderDef {
  /** UI 표시명 */
  label: string;
  /** Bun.which 설치 검사 대상 바이너리 */
  bin: string;
  /** 새 터미널 창에서 실행할 명령 토큰 */
  launch: string[];
}

export const PROVIDERS: Record<RunTarget, ProviderDef> = {
  'claude-code': { label: 'Claude Code', bin: 'claude', launch: ['claude'] },
  gemini: { label: 'Gemini', bin: 'gemini', launch: ['gemini'] },
  copilot: { label: 'GitHub Copilot', bin: 'copilot', launch: ['copilot'] },
  codex: { label: 'Codex', bin: 'codex', launch: ['codex'] },
};

export const RUN_TARGETS = Object.keys(PROVIDERS) as RunTarget[];

export function isRunTarget(value: unknown): value is RunTarget {
  return typeof value === 'string' && value in PROVIDERS;
}
