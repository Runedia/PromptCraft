import { Router } from 'express';
import { config, initialize } from '../../core/db/index.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    await initialize();
    const all = config.getAll();
    res.json(all);
  } catch (err) {
    next(err);
  }
});

router.put('/', async (req, res, next) => {
  try {
    await initialize();
    const updates = req.body as Record<string, string>;
    for (const [key, value] of Object.entries(updates)) {
      config.set(key, value);
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// 설정 키 삭제. "시스템 따름"(ui.language 삭제 → OS 감지 복귀) 등에 사용.
router.delete('/:key', async (req, res, next) => {
  try {
    await initialize();
    const removed = config.delete(req.params.key);
    res.json({ success: true, removed });
  } catch (err) {
    next(err);
  }
});

export default router;
