'use strict';

// chalk, @inquirer/prompts는 ESM-only이므로 동적 import 사용
let _chalk = null;
let _inquirerPrompts = null;

async function getChalk() {
  if (!_chalk) {
    const mod = await import('chalk');
    _chalk = mod.default;
  }
  return _chalk;
}

async function getInquirerPrompts() {
  if (!_inquirerPrompts) {
    _inquirerPrompts = await import('@inquirer/prompts');
  }
  return _inquirerPrompts;
}

// --no-color 옵션 적용
function applyNoColor() {
  if (_chalk) {
    _chalk.level = 0;
  }
}

// ─── Chalk 출력 헬퍼 ─────────────────────────────────────────────

async function success(msg) {
  const chalk = await getChalk();
  console.log(chalk.green(msg));
}

async function error(msg) {
  const chalk = await getChalk();
  console.error(chalk.red(msg));
}

async function info(msg) {
  const chalk = await getChalk();
  console.log(chalk.cyan(msg));
}

async function warn(msg) {
  const chalk = await getChalk();
  console.log(chalk.yellow(msg));
}

async function section(title) {
  const chalk = await getChalk();
  const line = '─'.repeat(40);
  console.log(chalk.bold(`\n${line}`));
  console.log(chalk.bold(`  ${title}`));
  console.log(chalk.bold(`${line}`));
}

// ─── Inquirer 입력 헬퍼 ──────────────────────────────────────────

async function askText(message, options = {}) {
  const { input } = await getInquirerPrompts();
  return await input({
    message,
    default: options.default,
    validate: options.validate,
  });
}

async function askSelect(message, choices) {
  const { select } = await getInquirerPrompts();
  // 문자열 배열을 {name, value} 형식으로 변환
  const formattedChoices = choices.map(choice =>
    typeof choice === 'string' ? { name: choice, value: choice } : choice
  );
  return await select({ message, choices: formattedChoices });
}

/**
 * 여러 줄 텍스트 입력 — 빈 줄(Enter 두 번)로 입력 종료
 */
async function askMultiline(message) {
  const { input } = await getInquirerPrompts();
  const chalk = await getChalk();
  console.log(chalk.dim(`${message} (빈 줄 입력 시 종료)`));

  const lines = [];
  let done = false;

  while (!done) {
    const line = await input({ message: '>' });
    if (line === '') {
      done = true;
    } else {
      lines.push(line);
    }
  }

  return lines.join('\n');
}

async function askConfirm(message) {
  const { confirm } = await getInquirerPrompts();
  return await confirm({ message, default: true });
}

// ─── 스피너 (chalk + setInterval) ────────────────────────────────

let _spinnerInterval = null;
const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

async function startSpinner(msg) {
  const chalk = await getChalk();
  let i = 0;
  process.stdout.write('\x1B[?25l'); // 커서 숨김
  _spinnerInterval = setInterval(() => {
    process.stdout.write(`\r${chalk.cyan(SPINNER_FRAMES[i % SPINNER_FRAMES.length])} ${msg}`);
    i++;
  }, 80);
}

function stopSpinner(finalMsg) {
  if (_spinnerInterval) {
    clearInterval(_spinnerInterval);
    _spinnerInterval = null;
  }
  process.stdout.write('\x1B[?25h'); // 커서 복원
  process.stdout.write('\r\x1B[K');  // 현재 줄 지우기
  if (finalMsg) {
    console.log(finalMsg);
  }
}

/**
 * @멘션 지원 멀티라인 입력
 * Inquirer를 우회하고 Node.js readline 직접 사용
 * @param {string} message - 표시할 질문
 * @param {string} projectRoot - 프로젝트 루트 경로
 * @returns {Promise<string>}
 */
async function askMentionMultiline(message, projectRoot) {
  const readline = require('readline');
  const { autocompleteFilePathSync, parseMentions } = require('./file-mention');

  const chalk = await getChalk();

  console.log(chalk.bold(message));
  console.log(chalk.dim('  @경로로 파일 첨부 가능 | 빈 줄 입력으로 완료'));

  const lines = [];

  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
      completer: (line) => {
        const atIndex = line.lastIndexOf('@');
        if (atIndex !== -1) {
          const partial = line.slice(atIndex + 1);
          const completions = autocompleteFilePathSync(partial, projectRoot);
          if (completions.length === 0) return [[], line];
          const prefix = line.slice(0, atIndex + 1); // "@" 포함 이전 부분
          return [completions.map(c => `${prefix}${c}`), line];
        }
        return [[], line];
      }
    });

    rl.on('line', async (line) => {
      if (line === '') {
        rl.close();
        const rawText = lines.join('\n');
        const processed = parseMentions(rawText, projectRoot);
        resolve(processed);
      } else {
        lines.push(line);
      }
    });

    rl.on('close', () => {
      if (lines.length > 0) {
        const rawText = lines.join('\n');
        const processed = parseMentions(rawText, projectRoot);
        resolve(processed);
      }
    });

    rl.on('SIGINT', () => {
      rl.close();
      resolve(lines.join('\n'));
    });
  });
}

module.exports = {
  getChalk,
  getInquirerPrompts,
  applyNoColor,
  success,
  error,
  info,
  warn,
  section,
  askText,
  askSelect,
  askMultiline,
  askMentionMultiline,
  askConfirm,
  startSpinner,
  stopSpinner,
};
