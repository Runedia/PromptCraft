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
const ROLE_MAPPINGS_FILE = path.join(DATA_DIR, 'role-mappings.json');

const overlayCache = new Map<string, DomainOverlay | null>();
let roleMappingsCache: RoleMappings | null = null;

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

/** 테스트용 캐시 초기화 */
export function clearDomainLoaderCache(): void {
  overlayCache.clear();
  roleMappingsCache = null;
}
