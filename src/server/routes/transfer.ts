import express, { Router } from 'express';
import { initialize } from '../../core/db/index.js';
import { exportData, importData } from '../../core/db/transfer.js';
import { ValidationError } from '../../shared/errors.js';

const router = Router();

router.get('/export', async (_req, res, next) => {
  try {
    await initialize();
    const exportedAt = new Date().toISOString();
    const bundle = exportData(exportedAt);
    const date = exportedAt.slice(0, 10).replace(/-/g, '');
    res.setHeader('Content-Disposition', `attachment; filename="promptcraft-export-${date}.json"`);
    res.json(bundle);
  } catch (err) {
    next(err);
  }
});

// 대량 히스토리 import를 위해 라우트 전용 limit. server/index.ts에서 이 라우터를
// 전역 express.json(5mb)보다 먼저 마운트해야 이 limit이 적용된다.
router.post('/import', express.json({ limit: '50mb' }), async (req, res, next) => {
  try {
    await initialize();
    const result = importData(req.body);
    res.json(result);
  } catch (err) {
    if (err instanceof ValidationError) {
      res.status(400).json({ error: err.message });
      return;
    }
    next(err);
  }
});

export default router;
