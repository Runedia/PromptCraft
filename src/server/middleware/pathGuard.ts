import path from 'node:path';

const BLOCKED_PATTERNS = [/\.env(\..+)?$/, /\.(exe|dll|so|bin|jpg|png|gif|mp4|zip)$/i];
const PATH_TRAVERSAL_PATTERN = /\.\./;

export function isPathAllowed(filePath: string, scanRoot: string): boolean {
  if (PATH_TRAVERSAL_PATTERN.test(filePath)) return false;
  if (BLOCKED_PATTERNS.some((p) => p.test(filePath))) return false;
  const resolved = path.resolve(scanRoot, filePath);
  return resolved.startsWith(path.resolve(scanRoot));
}

export function validatePath(filePath: string, scanRoot: string): string {
  if (!isPathAllowed(filePath, scanRoot)) {
    throw new Error(`접근이 허용되지 않는 경로입니다: ${filePath}`);
  }
  return path.resolve(scanRoot, filePath);
}
