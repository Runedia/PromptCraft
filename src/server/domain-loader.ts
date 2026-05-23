import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DomainOverlay } from '../core/builder/domain-overlay.js';
import type { RoleMappings } from '../core/builder/role-resolver.js';
import type { ProgrammingDomain } from '../core/types/domain.js';

const __filename = fileURLToPath(import.meta.url);
const moduleDirname = path.dirname(__filename);
const DATA_DIR = path.join(moduleDirname, '../../data');
const DOMAINS_DIR = path.join(DATA_DIR, 'domains');
const TREES_DIR = path.join(DATA_DIR, 'trees');
const ROLE_MAPPINGS_FILE = path.join(DATA_DIR, 'role-mappings.json');

const overlayCache = new Map<string, DomainOverlay | null>();
let roleMappingsCache: RoleMappings | null = null;
let treesMetaCache: TreeMeta[] | null = null;

export interface TreeMeta {
  id: string;
  roleSuffix?: string;
}

/**
 * 도메인 오버레이 파일을 로딩한다 (캐시됨).
 * data/domains/{domain}.json이 없으면 null 반환.
 */
export function loadDomainOverlay(domain: ProgrammingDomain | string): DomainOverlay | null {
  if (overlayCache.has(domain)) {
    return overlayCache.get(domain) ?? null;
  }

  const filePath = path.join(DOMAINS_DIR, `${domain}.json`);
  if (!fs.existsSync(filePath)) {
    overlayCache.set(domain, null);
    return null;
  }

  try {
    const overlay = JSON.parse(fs.readFileSync(filePath, 'utf8')) as DomainOverlay;
    overlayCache.set(domain, overlay);
    return overlay;
  } catch {
    overlayCache.set(domain, null);
    return null;
  }
}

/**
 * role-mappings.json을 로딩한다 (캐시됨).
 */
export function loadRoleMappings(): RoleMappings | null {
  if (roleMappingsCache) return roleMappingsCache;

  if (!fs.existsSync(ROLE_MAPPINGS_FILE)) return null;

  try {
    roleMappingsCache = JSON.parse(fs.readFileSync(ROLE_MAPPINGS_FILE, 'utf8')) as RoleMappings;
    return roleMappingsCache;
  } catch {
    return null;
  }
}

/**
 * data/trees/*.json 메타(id, roleSuffix만) 로딩 (캐시됨).
 * scan API의 roleSuggestionsByTree 생성에 사용.
 */
export function loadTreesMeta(): TreeMeta[] {
  if (treesMetaCache) return treesMetaCache;

  if (!fs.existsSync(TREES_DIR)) {
    treesMetaCache = [];
    return treesMetaCache;
  }

  const files = fs.readdirSync(TREES_DIR).filter((f) => f.endsWith('.json'));
  const metas: TreeMeta[] = [];
  for (const f of files) {
    try {
      const tree = JSON.parse(fs.readFileSync(path.join(TREES_DIR, f), 'utf8')) as { id?: string; roleSuffix?: string };
      if (tree.id) metas.push({ id: tree.id, roleSuffix: tree.roleSuffix });
    } catch {
      // 개별 파일 파싱 실패는 무시
    }
  }
  treesMetaCache = metas;
  return metas;
}

/** 테스트용 캐시 초기화 */
export function clearDomainLoaderCache(): void {
  overlayCache.clear();
  roleMappingsCache = null;
  treesMetaCache = null;
}
