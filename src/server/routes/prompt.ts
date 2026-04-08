import { Router } from 'express';
import { buildPrompt } from '../../core/builder/promptBuilder.js';
import { estimateTokens } from '../../core/builder/tokenEstimator.js';
import { initialize, history } from '../../core/db/index.js';
import type { SectionCard } from '../../core/types/card.js';

const router = Router();

router.post('/build', async (req, res, next) => {
  try {
    const { cards, treeId, saveToHistory } = req.body as {
      cards: SectionCard[];
      treeId: string;
      saveToHistory: boolean;
    };

    if (!Array.isArray(cards)) {
      res.status(400).json({ error: 'cards 배열이 필요합니다.' });
      return;
    }

    const prompt = buildPrompt(cards);
    const tokenEstimate = estimateTokens(prompt);

    let historyId: number | undefined;
    if (saveToHistory && prompt) {
      await initialize();
      const savedId = history.save({
        treeId,
        situation: cards.find((c) => c.id === 'goal')?.value ?? '',
        prompt,
        scanPath: null,
        answers: Object.fromEntries(cards.map((c) => [c.id, c.value])),
      });
      historyId = Number(savedId);
    }

    res.json({ prompt, tokenEstimate, historyId });
  } catch (err) {
    next(err);
  }
});

export default router;
