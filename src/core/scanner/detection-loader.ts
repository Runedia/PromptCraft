import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const moduleDirname = path.dirname(__filename);

const RULES_DIR = path.join(moduleDirname, '../../../data/detection-rules');

let languageMapCache = null;
let frameworkRulesCache = null;

/**
 * 언어 확장자 맵을 로딩한다 (캐시됨).
 * @returns {Record<string, string>}
 */
function getLanguageMap(): Record<string, string> {
  if (!languageMapCache) {
    const filePath = path.join(RULES_DIR, 'languages.json');
    languageMapCache = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  return languageMapCache;
}

/**
 * 프레임워크 감지 규칙을 로딩한다 (캐시됨).
 * @returns {object}
 */
function getFrameworkRules(): Record<string, unknown> {
  if (!frameworkRulesCache) {
    const filePath = path.join(RULES_DIR, 'frameworks.json');
    frameworkRulesCache = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  return frameworkRulesCache;
}

/** 캐시 초기화 (테스트용) */
function clearCache(): void {
  languageMapCache = null;
  frameworkRulesCache = null;
}

export { clearCache, getFrameworkRules, getLanguageMap };
