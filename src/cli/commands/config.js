'use strict';

const { Command } = require('commander');
const { ConfigManager } = require('../../core/config/config-manager');
const {
  success,
  error,
  info,
} = require('../ui/prompts');

const cmd = new Command('config')
  .description('PromptCraft 설정을 관리합니다');

cmd.command('list')
  .description('현재 설정 목록 표시')
  .action(async () => {
    const manager = new ConfigManager(process.cwd());
    const settings = manager.list();
    for (const [key, { value, source }] of Object.entries(settings)) {
      await info(`${key} = ${JSON.stringify(value)} (${source})`);
    }
  });

cmd.command('get <key>')
  .description('설정 값 조회')
  .action(async (key) => {
    const manager = new ConfigManager(process.cwd());
    const value = manager.get(key);
    await info(`${key} = ${JSON.stringify(value)}`);
  });

cmd.command('set <key> <value>')
  .description('설정 값 저장')
  .option('--project', '프로젝트 스코프에 저장')
  .action(async (key, value, options) => {
    const scope = options.project ? 'project' : 'global';
    const manager = new ConfigManager(process.cwd());
    let parsed;
    try { parsed = JSON.parse(value); } catch { parsed = value; }
    manager.set(key, parsed, scope);
    await success(`${key} = ${JSON.stringify(parsed)} (${scope})`);
  });

module.exports = cmd;
