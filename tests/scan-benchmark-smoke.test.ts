const path = require('node:path');
const fs = require('node:fs');

const { scan } = require('../src/core/scanner');
const { createScanPerfFixture, ensureDir, removeDir } = require('./scan-perf-utils');

describe('scan benchmark smoke', () => {
  const tmpRoot = path.join(process.cwd(), 'tests', 'tmp');

  test('synthetic fixture scan should stay under smoke threshold', async () => {
    ensureDir(tmpRoot);
    const fixture = createScanPerfFixture({
      maxDepth: 5,
      maxBranch: 3,
      fileCount: 300,
      seed: 20260323,
      baseRoot: tmpRoot,
      datasetName: `scan-smoke-${Date.now()}`,
    });

    try {
      const start = Date.now();
      const result = await scan(fixture.fixtureRoot, { depth: 100, metrics: true });
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(7000);
      expect(result.timings).toBeDefined();
      expect(result.timings.totalMs).toBeGreaterThan(0);
      expect(result.languages.length).toBeGreaterThan(0);
      expect(fs.existsSync(fixture.fixtureRoot)).toBe(true);
    } finally {
      removeDir(fixture.fixtureRoot);
    }
  });
});
