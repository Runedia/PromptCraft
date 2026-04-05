import path from 'node:path';
import { VERSION } from '../../shared/constants.js';

/**
 * ScanResult + userConfig → Canonical Context Model 변환.
 * 모든 출력 포맷은 이 모델에서 변환된다.
 *
 * @param {object} scanResult - scan() 반환값
 * @param {object} [userConfig] - 사용자 입력 (codingConventions, constraints, currentTask 등)
 * @returns {object} CanonicalContext
 */
function buildCanonicalContext(scanResult, userConfig) {
  const cfg = userConfig || {};
  const sr = scanResult || {};

  return {
    projectName: cfg.projectName || (sr.path ? path.basename(sr.path) : 'Project'),
    techStack: {
      languages: sr.languages || [],
      frameworks: sr.frameworks || [],
      packageManager: sr.packageManager || '',
    },
    structure: sr.structure || null,
    conventions: {
      coding: cfg.codingConventions || '',
    },
    constraints: cfg.constraints || '',
    currentTask: cfg.currentTask || '',
    configFiles: sr.configFiles || [],
    hasEnv: sr.hasEnv || false,
    metadata: {
      scanPath: sr.path || '',
      ignoreSource: sr.ignoreSource || 'default',
      scannedAt: sr.scannedAt || '',
      toolVersion: VERSION,
    },
  };
}

/**
 * CanonicalContext 필수 필드 검증.
 * @param {object} ctx
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateCanonicalContext(ctx) {
  const errors = [];
  if (!ctx) {
    errors.push('context가 null입니다');
    return { valid: false, errors };
  }
  if (!ctx.projectName) errors.push('projectName이 비어있습니다');
  if (!ctx.techStack) errors.push('techStack이 없습니다');
  return { valid: errors.length === 0, errors };
}

export { buildCanonicalContext, validateCanonicalContext };
