'use strict';

const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const { registerHelpers } = require('../prompt/helpers');
const { ContextError } = require('../../shared/errors');
const { CONTEXT_FORMATS } = require('../../shared/constants');
const { buildCanonicalContext } = require('./canonical-model');
const { getFormatter } = require('./formatter-registry');

const TEMPLATES_DIR = path.join(__dirname, '../../../data/templates');

let helpersRegistered = false;
const templateCache = new Map();

function ensureHelpers() {
  if (!helpersRegistered) {
    registerHelpers();
    helpersRegistered = true;
  }
}

function loadContextTemplate(templateFile) {
  if (templateCache.has(templateFile)) {
    return templateCache.get(templateFile);
  }

  const templatePath = path.join(TEMPLATES_DIR, templateFile);
  if (!fs.existsSync(templatePath)) {
    throw new ContextError(`컨텍스트 템플릿을 찾을 수 없습니다: ${templateFile}`);
  }

  const source = fs.readFileSync(templatePath, 'utf8');
  const compiled = Handlebars.compile(source);
  templateCache.set(templateFile, compiled);
  return compiled;
}

function diffLines(oldContent, newContent) {
  if (oldContent === newContent) {
    return { changed: false, addedLines: 0, removedLines: 0 };
  }

  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');

  const oldSet = new Set(oldLines);
  const newSet = new Set(newLines);

  const addedLines = newLines.filter(l => !oldSet.has(l)).length;
  const removedLines = oldLines.filter(l => !newSet.has(l)).length;

  return { changed: true, addedLines, removedLines };
}

function generate(format, scanResult, userConfig) {
  if (!CONTEXT_FORMATS[format]) {
    throw new ContextError(`지원하지 않는 포맷입니다: ${format}`);
  }

  ensureHelpers();

  try {
    const formatter = getFormatter(format);
    const canonical = buildCanonicalContext(scanResult, userConfig);
    const templateContext = formatter.toTemplateContext(canonical);
    const compiled = loadContextTemplate(formatter.templateFile);
    return compiled(templateContext);
  } catch (err) {
    if (err instanceof ContextError) throw err;
    throw new ContextError(`컨텍스트 생성 실패 (${format}): ${err.message}`);
  }
}

function preview(format, scanResult, userConfig) {
  return generate(format, scanResult, userConfig);
}

function write(outputPath, format, scanResult, userConfig) {
  if (!CONTEXT_FORMATS[format]) {
    throw new ContextError(`지원하지 않는 포맷입니다: ${format}`);
  }

  const newContent = generate(format, scanResult, userConfig);
  const fileName = CONTEXT_FORMATS[format];
  const filePath = path.join(outputPath, fileName);

  let diffResult;

  if (fs.existsSync(filePath)) {
    const existingContent = fs.readFileSync(filePath, 'utf8');
    diffResult = diffLines(existingContent, newContent);
    if (!diffResult.changed) {
      return { filePath, fileName, ...diffResult };
    }
  } else {
    diffResult = { changed: true, addedLines: newContent.split('\n').length, removedLines: 0 };
  }

  fs.mkdirSync(outputPath, { recursive: true });
  fs.writeFileSync(filePath, newContent, 'utf8');

  return { filePath, fileName, ...diffResult };
}

function generateAll(outputPath, scanResult, userConfig) {
  const results = {};
  for (const format of Object.keys(CONTEXT_FORMATS)) {
    results[format] = write(outputPath, format, scanResult, userConfig);
  }
  return results;
}

/**
 * 컨텍스트를 생성하고 품질 검증 결과를 함께 반환한다.
 * @returns {{ content: string, validation: object, secrets: object }}
 */
function generateWithValidation(format, scanResult, userConfig) {
  const content = generate(format, scanResult, userConfig);
  const { validateContext } = require('./validator');
  const { detectSecrets } = require('./secret-filter');

  const validation = validateContext(content, format);
  const secrets = detectSecrets(content);

  if (secrets.found) {
    validation.warnings.push(
      `비밀 정보가 감지되었습니다: ${secrets.matches.map(m => m.name).join(', ')}`
    );
  }

  return { content, validation, secrets };
}

module.exports = { generate, preview, write, generateAll, generateWithValidation };
