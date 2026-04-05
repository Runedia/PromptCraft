import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BuildError } from '../../shared/errors.js';
import type { PromptPreset, PromptPresetSummary } from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const moduleDirname = path.dirname(__filename);

const PRESETS_DIR = path.join(moduleDirname, '../../../data/template-presets');

function isJsonFile(name: string): boolean {
  return typeof name === 'string' && name.endsWith('.json');
}

function listPresets(treeId: string): PromptPresetSummary[] {
  if (!treeId) return [];
  const dir = path.join(PRESETS_DIR, treeId);
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter(isJsonFile);
  return files.map((file): PromptPresetSummary => {
    const filePath = path.join(dir, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8')) as PromptPreset;
    return {
      id: content.id,
      treeId: content.treeId,
      name: content.name,
      description: content.description || '',
      examples: Array.isArray(content.examples) ? content.examples : [],
    };
  });
}

function loadPreset(presetId: string): PromptPreset {
  if (!presetId) throw new BuildError('presetId가 필요합니다.');
  const treeDirs = fs.existsSync(PRESETS_DIR) ? fs.readdirSync(PRESETS_DIR) : [];

  for (const treeDir of treeDirs) {
    const dir = path.join(PRESETS_DIR, treeDir);
    if (!fs.statSync(dir).isDirectory()) continue;
    const files = fs.readdirSync(dir).filter(isJsonFile);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8')) as PromptPreset;
      if (content.id === presetId) return content;
    }
  }

  throw new BuildError(`프리셋을 찾을 수 없습니다: ${presetId}`);
}

export { listPresets, loadPreset };
