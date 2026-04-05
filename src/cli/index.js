'use strict';

const { Command } = require('commander');
const { VERSION } = require('../shared/constants');

async function run() {
  const program = new Command();

  program
    .name('promptcraft')
    .description('AI 코딩 도구를 위한 구조화된 프롬프트 빌더')
    .version(VERSION, '-v, --version')
    .option('--no-color', 'chalk 색상 비활성화');

  // 명령어 등록
  program.addCommand(require('./commands/scan'));
  program.addCommand(require('./commands/build'));
  // context 명령은 PRD 2.0에서 비활성화 (코드는 src/core/context/에 보존)
  // program.addCommand(require('./commands/context'));
  program.addCommand(require('./commands/history'));
  program.addCommand(require('./commands/config'));

  // 알 수 없는 명령어 처리
  program.on('command:*', () => {
    console.error(`알 수 없는 명령어: ${program.args.join(' ')}`);
    program.help();
  });

  await program.parseAsync(process.argv);
}

module.exports = { run };
