/** 환경변수 딕셔너리 (값은 항상 string) */
export type EnvDict = Record<string, string>;

const PATH_KEY = 'Path';

/** 대소문자 무시하고 PATH 값을 찾는다 (Windows 환경변수는 case-insensitive). */
function findPath(dict: Record<string, string | undefined>): string | undefined {
  for (const [k, v] of Object.entries(dict)) {
    if (k.toLowerCase() === 'path' && v != null) return v;
  }
  return undefined;
}

/**
 * launch용 환경변수를 머지한다.
 * base(process.env) 위에 Machine → User 순으로 덮어쓰고, PATH만 Machine;User로 재결합한다.
 * 레지스트리에서 삭제된 변수는 반영하지 않는다(base 잔존).
 */
export function mergeLaunchEnv(base: Record<string, string | undefined>, machine: EnvDict, user: EnvDict): EnvDict {
  const out: EnvDict = {};
  for (const [k, v] of Object.entries(base)) if (v != null) out[k] = v;
  for (const [k, v] of Object.entries(machine)) out[k] = v;
  for (const [k, v] of Object.entries(user)) out[k] = v;

  const combined = [findPath(machine), findPath(user)].filter((p): p is string => !!p).join(';');
  const finalPath = combined || findPath(base) || '';

  for (const k of Object.keys(out)) if (k.toLowerCase() === 'path') delete out[k];
  if (finalPath) out[PATH_KEY] = finalPath;
  return out;
}
