import { Router } from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';

const router = Router();

async function getWindowsDrives(): Promise<string[]> {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const results = await Promise.all(
    letters.split('').map(async (l) => {
      const drive = `${l}:\\`;
      try {
        await fs.access(drive);
        return drive;
      } catch {
        return null;
      }
    })
  );
  return results.filter((d): d is string => d !== null);
}

router.get('/', async (req, res, next) => {
  try {
    const reqPath = (req.query.path as string | undefined)?.trim();

    if (!reqPath) {
      const isWin = process.platform === 'win32';
      if (isWin) {
        const drives = await getWindowsDrives();
        res.json({ current: '', parent: null, dirs: drives, isRoot: true });
      } else {
        const entries = await fs.readdir('/', { withFileTypes: true });
        const dirs = entries
          .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
          .map((e) => `/${e.name}`)
          .sort();
        res.json({ current: '/', parent: null, dirs, isRoot: true });
      }
      return;
    }

    const resolved = path.resolve(reqPath);
    const stat = await fs.stat(resolved).catch(() => null);
    if (!stat?.isDirectory()) {
      res.status(400).json({ error: '유효한 디렉토리 경로가 아닙니다.' });
      return;
    }

    const entries = await fs.readdir(resolved, { withFileTypes: true });
    const dirs = entries
      .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
      .map((e) => path.join(resolved, e.name))
      .sort((a, b) => a.localeCompare(b, 'ko'));

    const parentPath = path.dirname(resolved);
    const parent = parentPath !== resolved ? parentPath : null;

    res.json({ current: resolved, parent, dirs, isRoot: false });
  } catch (err) {
    next(err);
  }
});

export default router;
