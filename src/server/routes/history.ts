import { Router } from 'express';
import { history, initialize } from '../../core/db/index.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    await initialize();
    const records = history.findAll();
    res.json(records);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    await initialize();
    const id = Number(req.params.id);
    const record = history.findById(id);
    if (!record) {
      res.status(404).json({ error: '히스토리를 찾을 수 없습니다.' });
      return;
    }
    res.json(record);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await initialize();
    const id = Number(req.params.id);
    history.delete(id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
