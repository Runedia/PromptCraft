import { Command } from 'commander';
import * as db from '../../core/db/index.js';
import { QNA_TREE_LABELS } from '../../shared/constants.js';
import { formatDate, truncate } from '../../shared/utils.js';
import { askConfirm, error, getChalk, info, section, success, warn } from '../ui/prompts.js';

// ─── 목록 출력 ────────────────────────────────────────────────────

async function printList(rows) {
  const chalk = await getChalk();
  const cols = process.stdout.columns || 80;

  // 헤더
  const headerId = ' # ';
  const headerDate = ' 날짜/시간            ';
  const headerSit = ' 상황         ';
  const headerPrev = ' 프롬프트 미리보기';
  console.log(chalk.bold(headerId) + chalk.bold(headerDate) + chalk.bold(headerSit) + chalk.bold(headerPrev));
  console.log(chalk.gray('─'.repeat(cols)));

  for (const row of rows) {
    const idStr = chalk.cyan(String(row.id).padStart(2));
    const dateStr = chalk.gray(formatDate(row.createdAt).padEnd(20));
    const sitStr = chalk.yellow((QNA_TREE_LABELS[row.treeId] || row.situation || '').padEnd(12));

    // 터미널 너비에서 고정 컬럼 길이를 빼서 미리보기 길이 계산
    const fixedLen = 3 + 20 + 12 + 4; // id + date + situation + separators
    const previewLen = Math.max(20, cols - fixedLen);
    const preview = truncate((row.prompt || '').replace(/\n/g, ' '), previewLen);

    console.log(` ${idStr}  ${dateStr}  ${sitStr}  ${preview}`);
  }
}

// ─── list 서브커맨드 ──────────────────────────────────────────────

async function listAction(options) {
  const limit = parseInt(options.limit, 10) || 20;
  const rows = db.history.findAll({ limit });
  if (rows.length === 0) {
    await info('저장된 히스토리가 없습니다. `promptcraft build` 로 첫 프롬프트를 생성해보세요.');
    return;
  }
  await printList(rows);
}

// ─── show 서브커맨드 ──────────────────────────────────────────────

async function showAction(id) {
  const record = db.history.findById(Number(id));
  if (!record) {
    await error('해당 항목을 찾을 수 없습니다.');
    process.exit(1);
  }

  const chalk = await getChalk();
  await section(`히스토리 #${record.id}`);

  console.log(chalk.bold('날짜:    ') + formatDate(record.createdAt));
  console.log(chalk.bold('상황:    ') + (QNA_TREE_LABELS[record.treeId] || record.situation || ''));
  if (record.scanPath) {
    console.log(chalk.bold('경로:    ') + record.scanPath);
  }
  console.log('');
  console.log(record.prompt);
}

// ─── copy 서브커맨드 ──────────────────────────────────────────────

async function copyAction(id) {
  const record = db.history.findById(Number(id));
  if (!record) {
    await error('해당 항목을 찾을 수 없습니다.');
    process.exit(1);
  }

  try {
    const { default: clipboardy } = await import('clipboardy');
    await clipboardy.write(record.prompt);
    await success('프롬프트가 클립보드에 복사되었습니다.');
  } catch (_) {
    await warn('클립보드 복사에 실패했습니다.');
  }
}

// ─── delete 서브커맨드 ────────────────────────────────────────────

async function deleteAction(id) {
  const record = db.history.findById(Number(id));
  if (!record) {
    await error('해당 항목을 찾을 수 없습니다.');
    process.exit(1);
  }

  const confirmed = await askConfirm(`히스토리 #${record.id}를 삭제하시겠습니까?`);
  if (!confirmed) return;

  db.history.delete(Number(id));
  await success('히스토리 항목이 삭제되었습니다.');
}

// ─── clear 서브커맨드 ─────────────────────────────────────────────

async function clearAction() {
  const total = db.history.count();
  if (total === 0) {
    await info('삭제할 히스토리가 없습니다.');
    return;
  }

  const confirmed = await askConfirm(`모든 히스토리(${total}개)를 삭제하시겠습니까?`);
  if (!confirmed) return;

  db.history.clearAll();
  await success('모든 히스토리가 삭제되었습니다.');
}

// ─── 기본 동작 (서브커맨드 없이 실행) ────────────────────────────

async function defaultAction(options) {
  const limit = parseInt(options.limit, 10) || 10;
  const rows = db.history.findAll({ limit });
  if (rows.length === 0) {
    await info('저장된 히스토리가 없습니다. `promptcraft build` 로 첫 프롬프트를 생성해보세요.');
    return;
  }
  await printList(rows);
}

// ─── Commander 명령 구성 ──────────────────────────────────────────

const cmd = new Command('history')
  .description('프롬프트 생성 히스토리를 조회합니다')
  .option('-l, --limit <n>', '표시할 최대 항목 수', '10')
  .action(async (options) => {
    await defaultAction(options);
  });

cmd
  .command('list')
  .description('히스토리 전체 목록을 표시합니다')
  .option('-l, --limit <n>', '표시할 최대 항목 수', '20')
  .action(async (options) => {
    await listAction(options);
  });

cmd
  .command('show <id>')
  .description('특정 히스토리 항목의 프롬프트를 전문 출력합니다')
  .action(async (id) => {
    await showAction(id);
  });

cmd
  .command('copy <id>')
  .description('특정 히스토리 항목을 클립보드에 복사합니다')
  .action(async (id) => {
    await copyAction(id);
  });

cmd
  .command('delete <id>')
  .description('특정 히스토리 항목을 삭제합니다')
  .action(async (id) => {
    await deleteAction(id);
  });

cmd
  .command('clear')
  .description('히스토리를 모두 삭제합니다')
  .action(async () => {
    await clearAction();
  });

export default cmd;
