import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const DEFAULT_EXTENSIONS = ['js', 'py', 'md', 'java'];

export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return function next() {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

export function ensureDir(targetPath: string): void {
  fs.mkdirSync(targetPath, { recursive: true });
}

export function removeDir(targetPath: string): void {
  fs.rmSync(targetPath, { recursive: true, force: true });
}

function createRandomTree(rootPath: string, maxDepth: number, maxBranch: number, random: () => number): string[] {
  const allDirs: string[] = [];
  let dirIndex = 0;
  const queue: Array<[string, number]> = [[rootPath, 0]];

  while (queue.length > 0) {
    const nextItem = queue.shift();
    if (!nextItem) continue;
    const [currentDir, currentDepth] = nextItem;
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

function pick<T>(arr: T[], random: () => number): T {
  return arr[Math.floor(random() * arr.length)];
}

type ScanPerfFixtureOptions = {
  maxDepth?: number;
  maxBranch?: number;
  fileCount?: number;
  seed?: number;
  extensions?: string[];
  baseRoot?: string;
  datasetName?: string;
};

type ScanPerfFixture = {
  seed: number;
  maxDepth: number;
  maxBranch: number;
  fileCount: number;
  extensions: string[];
  fixtureRoot: string;
  files: string[];
};

export function createScanPerfFixture(options: ScanPerfFixtureOptions = {}): ScanPerfFixture {
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

  const manifest: ScanPerfFixture = {
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
