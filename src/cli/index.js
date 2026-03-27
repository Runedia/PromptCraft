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

  // serve 명령
  program
    .command('serve')
    .description('API 서버 시작')
    .option('-p, --port <port>', '포트 번호', '3001')
    .action((opts) => {
      const port = parseInt(opts.port, 10);
      const { createApp } = require('../api/server');
      const app = createApp();
      app.listen(port, () => {
        console.log(`PromptCraft API server running on http://localhost:${port}`);
      });
    });

  // 알 수 없는 명령어 처리
  program.on('command:*', () => {
    console.error(`알 수 없는 명령어: ${program.args.join(' ')}`);
    program.help();
  });

  await program.parseAsync(process.argv);
}

module.exports = { run };
