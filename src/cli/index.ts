import { Command } from 'commander';
import { VERSION } from '../shared/constants.js';
import { serveCommand } from './commands/serve.js';

async function run() {
  const program = new Command();

  program.name('promptcraft').description('로컬 설치형 프롬프트 설계 도구').version(VERSION, '-v, --version');

  program.addCommand(serveCommand);

  program.on('command:*', () => {
    console.error(`알 수 없는 명령어: ${program.args.join(' ')}`);
    program.help();
  });

  await program.parseAsync(process.argv);
}

export { run };
