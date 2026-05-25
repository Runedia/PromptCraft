import { Command } from 'commander';
import { VERSION } from '../shared/constants.js';
import { detectLocale } from '../shared/i18n/detectLocale.js';
import { t } from '../shared/i18n/t.js';
import { serveCommand } from './commands/serve.js';

async function run() {
  const lang = detectLocale();
  const program = new Command();

  program.name('promptcraft').description(t('cli.description', lang)).version(VERSION, '-v, --version');

  program.addCommand(serveCommand);

  program.on('command:*', () => {
    console.error(t('cli.unknownCommand', lang, { cmd: program.args.join(' ') }));
    program.help();
  });

  await program.parseAsync(process.argv);
}

export { run };
