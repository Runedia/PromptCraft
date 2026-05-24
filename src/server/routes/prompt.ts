import { Router } from 'express';
import { buildPrompt } from '../../core/builder/promptBuilder.js';
import { estimateTokens } from '../../core/builder/tokenEstimator.js';
import { history, initialize } from '../../core/db/index.js';
import { isRunTarget, PROVIDERS } from '../../core/run/providers.js';
import type { SectionCard } from '../../core/types/card.js';
import { isInstalled, isValidCwd, launch, providerAvailability } from '../run/launcher.js';

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

router.get('/providers', (_req, res) => {
  res.json(providerAvailability());
});

router.post('/run', (req, res) => {
  const { target, cwd } = req.body as { target?: unknown; cwd?: unknown };
  if (!isRunTarget(target)) {
    res.status(400).json({ error: 'invalid_target' });
    return;
  }
  if (typeof cwd !== 'string' || !isValidCwd(cwd)) {
    res.status(400).json({ error: 'invalid_cwd' });
    return;
  }
  if (!isInstalled(target)) {
    res.status(409).json({ error: 'not_installed', bin: PROVIDERS[target].bin });
    return;
  }
  try {
    const { launched } = launch(target, cwd);
    res.json({ ok: true, launched });
  } catch {
    res.status(500).json({ error: 'launch_failed' });
  }
});

export default router;
