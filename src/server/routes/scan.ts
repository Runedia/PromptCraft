import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Router } from 'express';
import { scan } from '../../core/scanner/index.js';

const router = Router();
const LAST_SCAN_PATH = path.join(os.homedir(), '.promptcraft', 'last-scan.json');

router.post('/', async (req, res, next) => {
  try {
    const { path: scanPath } = req.body as { path: string };
    if (!scanPath || typeof scanPath !== 'string') {
      res.status(400).json({ error: 'path 필드가 필요합니다.' });
      return;
    }

    const start = Date.now();
    const result = await scan(scanPath);
    const elapsedMs = Date.now() - start;

    // 마지막 스캔 결과 저장
    await fs.mkdir(path.dirname(LAST_SCAN_PATH), { recursive: true });
    await fs.writeFile(LAST_SCAN_PATH, JSON.stringify({ ...result, elapsedMs }, null, 2));

    res.json({ ...result, elapsedMs });
  } catch (err) {
    next(err);
  }
});

router.get('/last', async (_req, res, _next) => {
  try {
    const raw = await fs.readFile(LAST_SCAN_PATH, 'utf-8');
    res.json(JSON.parse(raw));
  } catch {
    res.status(404).json({ error: '이전 스캔 결과가 없습니다.' });
  }
});

export default router;
