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
  program.addCommand(require('./commands/context'));
  program.addCommand(require('./commands/history'));

  // serve 명령 (Phase 14 이후 구현)
  program
    .command('serve')
    .description('API 서버 + Web UI 시작 (Phase 14에서 구현)')
    .action(() => {
      console.log('serve 명령은 Phase 14에서 구현됩니다.');
    });

  // 알 수 없는 명령어 처리
  program.on('command:*', () => {
    console.error(`알 수 없는 명령어: ${program.args.join(' ')}`);
    program.help();
  });

  await program.parseAsync(process.argv);
}

module.exports = { run };
