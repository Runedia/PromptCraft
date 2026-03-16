#!/usr/bin/env node

'use strict';

// 미지원 Node.js 버전 조기 차단
const [major] = process.versions.node.split('.').map(Number);
if (major < 24) {
  console.error(`PromptCraft requires Node.js 24 or higher. Current: ${process.versions.node}`);
  process.exit(1);
}

const { initialize } = require('../src/core/db');
const cli = require('../src/cli');

(async () => {
  try {
    await initialize();
    await cli.run();
  } catch (err) {
    console.error('Fatal error:', err.message);
    process.exit(1);
  }
})();
