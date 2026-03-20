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
  askConfirm,
  startSpinner,
  stopSpinner,
};
