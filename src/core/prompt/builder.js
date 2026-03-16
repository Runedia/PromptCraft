'use strict';

const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const { registerHelpers } = require('./helpers');
const { BuildError } = require('../../shared/errors');
const { QNA_TREE_LABELS } = require('../../shared/constants');

const TEMPLATES_DIR = path.join(__dirname, '../../../data/templates');

let helpersRegistered = false;
const templateCache = new Map();

function ensureHelpers() {
  if (!helpersRegistered) {
    registerHelpers();
    helpersRegistered = true;
  }
}

function loadTemplate(treeId) {
  if (templateCache.has(treeId)) {
    return templateCache.get(treeId);
  }

  const specificPath = path.join(TEMPLATES_DIR, `prompt-${treeId}.hbs`);
  const defaultPath = path.join(TEMPLATES_DIR, 'prompt-default.hbs');

  let templateSource;
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

function buildPrompt(treeId, answers, scanResult) {
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
  } catch (err) {
    if (err instanceof BuildError) throw err;
    throw new BuildError(`프롬프트 렌더링 실패: ${err.message}`);
  }
}

function buildFromAnswers(treeId, answers, scanResult) {
  return buildPrompt(treeId, answers, scanResult);
}

function getAvailableTemplates() {
  const files = fs.readdirSync(TEMPLATES_DIR);
  return files
    .filter(f => f.startsWith('prompt-') && f.endsWith('.hbs') && f !== 'prompt-default.hbs')
    .map(f => f.replace(/^prompt-/, '').replace(/\.hbs$/, ''));
}

function estimateTokenCount(prompt) {
  if (typeof prompt !== 'string') return 0;
  return Math.ceil(prompt.length / 4);
}

module.exports = { loadTemplate, buildPrompt, buildFromAnswers, getAvailableTemplates, estimateTokenCount };
