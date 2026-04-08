import { Router } from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { validatePath } from '../middleware/pathGuard.js';

const router = Router();

const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', '.next', 'build', 'coverage', '.turbo', 'out']);

router.get('/suggest', async (req, res, next) => {
  try {
    const root = (req.query.root as string | undefined)?.trim();
    const partial = ((req.query.partial as string | undefined) ?? '').trim();

    if (!root) {
      res.status(400).json({ error: 'root가 필요합니다.' });
      return;
    }

    const lastSlash = partial.lastIndexOf('/');
    const dirPart = lastSlash >= 0 ? partial.slice(0, lastSlash + 1) : '';
    const filterPrefix = lastSlash >= 0 ? partial.slice(lastSlash + 1) : partial;

    const targetDir = path.resolve(root, dirPart);
    const resolvedRoot = path.resolve(root);

    if (!targetDir.startsWith(resolvedRoot)) {
      res.status(403).json({ error: '접근이 허용되지 않는 경로입니다.' });
      return;
    }

    const entries = await fs.readdir(targetDir, { withFileTypes: true }).catch(() => []);

    const dirs: string[] = [];
    const files: string[] = [];

    for (const entry of entries) {
      if (filterPrefix && !entry.name.startsWith(filterPrefix)) continue;
      if (entry.name.startsWith('.') && !filterPrefix.startsWith('.')) continue;

      if (entry.isDirectory()) {
        if (IGNORE_DIRS.has(entry.name)) continue;
        dirs.push(`${dirPart}${entry.name}/`);
      } else {
        files.push(`${dirPart}${entry.name}`);
      }
    }

    const suggestions = [...dirs.sort(), ...files.sort()].slice(0, 30).map((p) => ({
      path: p,
      display: p,
      isDir: p.endsWith('/'),
    }));

    res.json({ suggestions });
  } catch (err) {
    next(err);
  }
});

router.post('/read', async (req, res, next) => {
  try {
    const { filePath, scanRoot } = req.body as { filePath: string; scanRoot: string };

    if (!filePath || !scanRoot) {
      res.status(400).json({ error: 'filePath와 scanRoot가 필요합니다.' });
      return;
    }

    const absolutePath = validatePath(filePath, scanRoot);
    const content = await fs.readFile(absolutePath, 'utf-8');
    res.json({ content, filePath });
  } catch (err) {
    if (err instanceof Error && err.message.includes('접근이 허용되지 않는')) {
      res.status(403).json({ error: err.message });
      return;
    }
    next(err);
  }
});

export default router;
