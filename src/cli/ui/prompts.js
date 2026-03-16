'use strict';

// chalk, inquirer는 ESM-only이므로 동적 import 사용
let _chalk = null;
let _inquirer = null;

async function getChalk() {
  if (!_chalk) {
    const mod = await import('chalk');
    _chalk = mod.default;
  }
  return _chalk;
}

async function getInquirer() {
  if (!_inquirer) {
    const mod = await import('inquirer');
    _inquirer = mod.default;
  }
  return _inquirer;
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
  console.log(chalk.blue(msg));
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
  const inquirer = await getInquirer();
  const { answer } = await inquirer.prompt([
    {
      type: 'input',
      name: 'answer',
      message,
      default: options.default,
      validate: options.validate,
    },
  ]);
  return answer;
}

async function askSelect(message, choices) {
  const inquirer = await getInquirer();
  const { answer } = await inquirer.prompt([
    {
      type: 'list',
      name: 'answer',
      message,
      choices,
    },
  ]);
  return answer;
}

/**
 * 여러 줄 텍스트 입력 — 빈 줄(Enter 두 번)로 입력 종료
 */
async function askMultiline(message) {
  const inquirer = await getInquirer();
  const chalk = await getChalk();
  console.log(chalk.dim(`${message} (빈 줄 입력 시 종료)`));

  const lines = [];
  let done = false;

  while (!done) {
    const { line } = await inquirer.prompt([
      { type: 'input', name: 'line', message: '>' },
    ]);
    if (line === '') {
      done = true;
    } else {
      lines.push(line);
    }
  }

  return lines.join('\n');
}

async function askConfirm(message) {
  const inquirer = await getInquirer();
  const { answer } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'answer',
      message,
      default: true,
    },
  ]);
  return answer;
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

module.exports = {
  getChalk,
  getInquirer,
  applyNoColor,
  success,
  error,
  info,
  warn,
  section,
  askText,
  askSelect,
  askMultiline,
  askConfirm,
  startSpinner,
  stopSpinner,
};
