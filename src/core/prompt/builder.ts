import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Handlebars from 'handlebars';
import { QNA_TREE_LABELS } from '../../shared/constants.js';
import { BuildError } from '../../shared/errors.js';
import type { PromptAnswers, ScanResult } from '../types.js';
import { registerHelpers } from './helpers.js';
import { listPresets, loadPreset } from './presets.js';

const __filename = fileURLToPath(import.meta.url);
const moduleDirname = path.dirname(__filename);

const TEMPLATES_DIR = path.join(moduleDirname, '../../../data/templates');

let helpersRegistered = false;
const templateCache = new Map<
  string,
  { compiled: Handlebars.TemplateDelegate; resolvedId: string }
>();

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function ensureHelpers(): void {
  if (!helpersRegistered) {
    registerHelpers();
    helpersRegistered = true;
  }
}

function loadTemplate(treeId: string): {
  compiled: Handlebars.TemplateDelegate;
  resolvedId: string;
} {
  if (templateCache.has(treeId)) {
    return templateCache.get(treeId);
  }

  const specificPath = path.join(TEMPLATES_DIR, `prompt-${treeId}.hbs`);
  const defaultPath = path.join(TEMPLATES_DIR, 'prompt-default.hbs');

  let templateSource: string;
  let resolvedId = treeId;

  if (fs.existsSync(specificPath)) {
    templateSource = fs.readFileSync(specificPath, 'utf8');
  } else if (fs.existsSync(defaultPath)) {
    templateSource = fs.readFileSync(defaultPath, 'utf8');
    resolvedId = 'default';
  } else {
    throw new BuildError('기본 템플릿 파일을 찾을 수 없습니다: prompt-default.hbs');
  }

  const compiled = Handlebars.compile(templateSource);
  templateCache.set(treeId, { compiled, resolvedId });
  return { compiled, resolvedId };
}

function buildPrompt(
  treeId: string,
  answers: PromptAnswers,
  scanResult?: ScanResult | null
): string {
  ensureHelpers();

  try {
    const { compiled } = loadTemplate(treeId);

    const context = {
      treeId,
      situationLabel: QNA_TREE_LABELS[treeId] || treeId,
      scanResult: scanResult || null,
      ...answers,
    };

    return compiled(context);
  } catch (err: unknown) {
    if (err instanceof BuildError) throw err;
    throw new BuildError(`프롬프트 렌더링 실패: ${toErrorMessage(err)}`);
  }
}

function buildFromAnswers(
  treeId: string,
  answers: PromptAnswers,
  scanResult?: ScanResult | null
): string {
  return buildPrompt(treeId, answers, scanResult);
}

function getAvailableTemplates(): string[] {
  const files = fs.readdirSync(TEMPLATES_DIR);
  return files
    .filter((f) => f.startsWith('prompt-') && f.endsWith('.hbs') && f !== 'prompt-default.hbs')
    .map((f) => f.replace(/^prompt-/, '').replace(/\.hbs$/, ''));
}

function estimateTokenCount(prompt: string): number {
  if (typeof prompt !== 'string') return 0;
  return Math.ceil(prompt.length / 4);
}

export {
  buildFromAnswers,
  buildPrompt,
  estimateTokenCount,
  getAvailableTemplates,
  listPresets,
  loadPreset,
  loadTemplate,
};
