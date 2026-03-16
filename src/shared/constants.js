'use strict';

const os = require('os');
const path = require('path');

const APP_NAME = 'promptcraft';
const VERSION = '0.1.0';

const DATA_DIR = path.join(os.homedir(), `.${APP_NAME}`);
const DB_PATH = path.join(DATA_DIR, `${APP_NAME}.db`);
const LAST_SCAN_PATH = path.join(DATA_DIR, 'last-scan.json');

const QNA_TREE_IDS = {
  ERROR_SOLVING: 'error-solving',
  FEATURE_IMPL:  'feature-impl',
  CODE_REVIEW:   'code-review',
  CONCEPT_LEARN: 'concept-learn',
};

const QNA_TREE_LABELS = {
  'error-solving': '에러 해결',
  'feature-impl':  '기능 구현',
  'code-review':   '코드 리뷰',
  'concept-learn': '개념 학습',
};

const CONTEXT_FORMATS = {
  claude:       'CLAUDE.md',
  gemini:       'GEMINI.md',
};

const API_PORT = parseInt(process.env.PORT || '3000', 10);

module.exports = {
  APP_NAME,
  VERSION,
  DATA_DIR,
  DB_PATH,
  LAST_SCAN_PATH,
  QNA_TREE_IDS,
  QNA_TREE_LABELS,
  CONTEXT_FORMATS,
  API_PORT,
};
