import { Router } from 'express';
import { initialize, template } from '../../core/db/index.js';
import type { TemplateSaveInput } from '../../core/types.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    await initialize();
    const records = template.findAll();
    res.json(records);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    await initialize();
    const input = req.body as TemplateSaveInput;
    if (!input.name || !input.treeId) {
      res.status(400).json({ error: 'name과 treeId가 필요합니다.' });
      return;
    }
    const savedId = template.save(input);
    const saved = template.findById(Number(savedId));
    res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await initialize();
    const id = Number(req.params.id);
    template.delete(id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
