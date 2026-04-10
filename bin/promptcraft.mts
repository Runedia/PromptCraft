#!/usr/bin/env node

const [major] = process.versions.node.split('.').map(Number);
if (major < 24) {
  console.error(`PromptCraft requires Node.js 24 or higher. Current: ${process.versions.node}`);
  process.exit(1);
}

type AnyFn = (...args: unknown[]) => unknown;

const getExport = <T extends AnyFn>(moduleValue: unknown, key: string): T | null => {
  const m = moduleValue as Record<string, unknown>;
  if (typeof m?.[key] === 'function') return m[key] as T;
  const def = m?.default as Record<string, unknown> | undefined;
  if (typeof def?.[key] === 'function') return def[key] as T;
  return null;
};

const run = async () => {
  const [dbModule, cliModule] = await Promise.all([import('../src/core/db/index.js'), import('../src/cli/index.js')]);

  const initialize = getExport(dbModule, 'initialize');
  const runCli = getExport(cliModule, 'run');

  if (!initialize || !runCli) {
    throw new Error('Failed to load runtime entry modules.');
  }

  await initialize();
  await runCli();
};

run().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
