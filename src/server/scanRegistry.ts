import fs from 'node:fs';
import path from 'node:path';
import { DATA_DIR } from '../shared/constants.js';

/**
 * 스캔된 프로젝트 루트의 세션 간 영속 집합.
 *
 * 목적: mention 엔드포인트(파일 읽기)의 `scanRoot`가 사용자가 실제로 스캔한 루트인지 게이트한다.
 * CORS/Host(transport)가 회귀하더라도 mention/read가 임의 파일 읽기 primitive가 되지 않도록 하는 심층 방어.
 *
 * - additive: 한 번 등록된 루트는 제거되지 않는다. 따라서 정규 UI 흐름(스캔→캐시 재사용→재시작)은 절대 거부되지 않는다.
 * - 공격자는 preflight 보호된 POST /api/scan 없이 자기 루트를 집합에 넣을 수 없다.
 */

/** 영속 파일 경로. 테스트 격리를 위해 PROMPTCRAFT_SCANNED_ROOTS_PATH로 오버라이드 가능(런타임 평가). */
function scannedRootsPath(): string {
  return process.env.PROMPTCRAFT_SCANNED_ROOTS_PATH || path.join(DATA_DIR, 'scanned-roots.json');
}

/** 멤버십 판정용 정규화 키: 절대경로 resolve 후 win32에서 대소문자 무시. */
function normalize(p: string): string {
  const resolved = path.resolve(p);
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
}

let roots: Set<string> | null = null;

/** 최초 접근 시 디스크에서 시드. 파일 부재/파싱 실패는 빈 집합으로 시작. */
function load(): Set<string> {
  if (roots) return roots;
  const set = new Set<string>();
  try {
    const raw = fs.readFileSync(scannedRootsPath(), 'utf-8');
    const arr = JSON.parse(raw) as unknown;
    if (Array.isArray(arr)) {
      for (const r of arr) if (typeof r === 'string') set.add(normalize(r));
    }
  } catch {
    // 시드 없음 → 빈 집합
  }
  roots = set;
  return roots;
}

/** 정규화 키 집합을 디스크에 비차단 기록(best-effort). */
function persist(set: Set<string>): void {
  const file = scannedRootsPath();
  void fs.promises
    .mkdir(path.dirname(file), { recursive: true })
    .then(() => fs.promises.writeFile(file, JSON.stringify([...set], null, 2)))
    .catch(() => {});
}

/** 스캔 성공 시 호출. 루트를 인메모리(동기)+디스크(비동기)에 등록. falsy/비문자열은 무시. */
export function registerScanRoot(root: unknown): void {
  if (!root || typeof root !== 'string') return;
  const set = load();
  const key = normalize(root);
  if (set.has(key)) return;
  set.add(key);
  persist(set);
}

/** root가 등록된 스캔 루트와 같거나 그 하위 경로면 허용. */
export function isAllowedScanRoot(root: unknown): boolean {
  if (!root || typeof root !== 'string') return false;
  const set = load();
  const key = normalize(root);
  if (set.has(key)) return true;
  for (const reg of set) {
    if (key.startsWith(reg + path.sep)) return true;
  }
  return false;
}

/** 테스트 전용: 인메모리 캐시를 비워 다음 접근 시 디스크 재시드를 유도. */
export function _resetForTest(): void {
  roots = null;
}
