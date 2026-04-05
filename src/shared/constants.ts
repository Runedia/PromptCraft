import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const moduleDirname = path.dirname(__filename);

const APP_NAME = 'promptcraft';
const VERSION = '0.1.0';

const DATA_DIR = path.join(os.homedir(), `.${APP_NAME}`);
const DB_PATH = path.join(DATA_DIR, `${APP_NAME}.db`);
const LAST_SCAN_PATH = path.join(DATA_DIR, 'last-scan.json');
const PRESET_DIR = path.join(moduleDirname, '../../data/template-presets');

const QNA_TREE_IDS = {
  ERROR_SOLVING: 'error-solving',
  FEATURE_IMPL: 'feature-impl',
  CODE_REVIEW: 'code-review',
  CONCEPT_LEARN: 'concept-learn',
};

const QNA_TREE_LABELS = {
  'error-solving': '에러 해결',
  'feature-impl': '기능 구현',
  'code-review': '코드 리뷰',
  'concept-learn': '개념 학습',
};

const QNA_TREE_DESCRIPTIONS = {
  'error-solving': '에러 메시지/스택 트레이스 기반 해결 프롬프트',
  'feature-impl': '새로운 기능 구현을 위한 프롬프트',
  'code-review': '작성한 코드에 대한 리뷰 요청 프롬프트',
  'concept-learn': '프로그래밍 개념/기술 학습 프롬프트',
};

// CONTEXT_FORMATS: PRD 2.0에서 비활성화 (CLI context 명령 제거)
// src/core/context/ 코드가 내부적으로 참조하므로 export는 유지 (재활용 가능성 보존)
const CONTEXT_FORMATS = {
  claude: 'CLAUDE.md',
  gemini: 'GEMINI.md',
  cursorrules: '.cursorrules',
};

export {
  APP_NAME,
  CONTEXT_FORMATS,
  DATA_DIR,
  DB_PATH,
  LAST_SCAN_PATH,
  PRESET_DIR,
  QNA_TREE_DESCRIPTIONS,
  QNA_TREE_IDS,
  QNA_TREE_LABELS,
  VERSION,
};
