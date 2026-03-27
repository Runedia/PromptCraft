'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const DEFAULT_EXTENSIONS = ['js', 'py', 'md', 'java'];

function createSeededRandom(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function ensureDir(targetPath) {
  fs.mkdirSync(targetPath, { recursive: true });
}

function removeDir(targetPath) {
  fs.rmSync(targetPath, { recursive: true, force: true });
}

function createRandomTree(rootPath, maxDepth, maxBranch, random) {
  const allDirs = [];
  let dirIndex = 0;
  const queue = [[rootPath, 0]];

  while (queue.length > 0) {
    const [currentDir, currentDepth] = queue.shift();
    if (currentDepth >= maxDepth) continue;

    const numChildren = Math.floor(random() * (maxBranch + 1));
    for (let i = 0; i < numChildren; i += 1) {
      dirIndex += 1;
      const childDir = path.join(currentDir, `d${String(dirIndex).padStart(4, '0')}`);
      ensureDir(childDir);
      allDirs.push(childDir);
      queue.push([childDir, currentDepth + 1]);
    }
  }

  return allDirs;
}

function pick(arr, random) {
  return arr[Math.floor(random() * arr.length)];
}

function createScanPerfFixture(options = {}) {
  const {
    maxDepth = 6,
    maxBranch = 4,
    fileCount = 1000,
    seed = 20260323,
    extensions = DEFAULT_EXTENSIONS,
    baseRoot,
    datasetName = 'scan-perf-fixture',
  } = options;

  const random = createSeededRandom(seed);
  const rootParent = baseRoot || fs.mkdtempSync(path.join(os.tmpdir(), 'promptcraft-'));
  const fixtureRoot = path.join(rootParent, datasetName);
  ensureDir(fixtureRoot);

  const allDirs = createRandomTree(fixtureRoot, maxDepth, maxBranch, random);
  const writeTargets = [fixtureRoot].concat(allDirs);

  const manifest = {
    seed,
    maxDepth,
    maxBranch,
    fileCount,
    extensions: extensions.slice(),
    fixtureRoot,
    files: [],
  };

  for (let i = 0; i < fileCount; i += 1) {
    const ext = pick(extensions, random);
    const level = pick(writeTargets, random);
    const filename = `f_${String(i).padStart(4, '0')}.${ext}`;
    const absolute = path.join(level, filename);
    fs.writeFileSync(absolute, '', 'utf8');
    manifest.files.push(path.relative(fixtureRoot, absolute));
  }

  return manifest;
}

module.exports = {
  DEFAULT_EXTENSIONS,
  createSeededRandom,
  createScanPerfFixture,
  ensureDir,
  removeDir,
};
