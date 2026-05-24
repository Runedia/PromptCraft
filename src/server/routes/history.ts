import { Router } from 'express';
import { history, initialize } from '../../core/db/index.js';
import type { PromptAnswers } from '../../core/types.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    await initialize();
    const { treeId, prompt, situation, answers } = req.body as {
      treeId?: unknown;
      prompt?: unknown;
      situation?: unknown;
      answers?: unknown;
    };
    if (typeof treeId !== 'string' || !treeId) {
      res.status(400).json({ error: 'treeId가 필요합니다.' });
      return;
    }
    if (typeof prompt !== 'string' || prompt.trim() === '') {
      res.status(400).json({ error: 'prompt가 필요합니다.' });
      return;
    }
    const latest = history.findLatestByTree(treeId);
    if (latest && latest.prompt === prompt) {
      res.status(200).json({ skipped: true });
      return;
    }
    const historyId = history.save({
      treeId,
      situation: typeof situation === 'string' ? situation : '',
      prompt,
      scanPath: null,
      answers: (answers && typeof answers === 'object' ? answers : {}) as PromptAnswers,
    });
    res.status(201).json({ historyId });
  } catch (err) {
    next(err);
  }
});

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
