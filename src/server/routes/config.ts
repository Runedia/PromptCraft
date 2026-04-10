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

export default router;
