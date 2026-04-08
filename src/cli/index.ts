import { Command } from 'commander';
import { VERSION } from '../shared/constants.js';
import configCommand from './commands/config.js';
import historyCommand from './commands/history.js';
import { serveCommand } from './commands/serve.js';

async function run() {
  const program = new Command();

  program
    .name('promptcraft')
    .description('AI 코딩 도구를 위한 구조화된 프롬프트 빌더')
    .version(VERSION, '-v, --version')
    .option('--no-color', 'chalk 색상 비활성화');

  // 명령어 등록
  program.addCommand(serveCommand);
  program.addCommand(historyCommand);
  program.addCommand(configCommand);

  // 알 수 없는 명령어 처리
  program.on('command:*', () => {
    console.error(`알 수 없는 명령어: ${program.args.join(' ')}`);
    program.help();
  });

  await program.parseAsync(process.argv);
}

export { run };
