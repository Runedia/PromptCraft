import { Router } from 'express';
import { buildPrompt } from '../../core/builder/promptBuilder.js';
import { estimateTokens } from '../../core/builder/tokenEstimator.js';
import { history, initialize } from '../../core/db/index.js';
import { structuralScore } from '../../core/refine/structuralScore.js';
import { isRunTarget, PROVIDERS } from '../../core/run/providers.js';
import type { SectionCard } from '../../core/types/card.js';
import { LOCALES, type Locale } from '../../shared/i18n/types.js';
import { getRefineConfig } from '../refine/config.js';
import * as refineService from '../refine/refineService.js';
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

router.post('/structural', (req, res) => {
  const { cards } = req.body as { cards: SectionCard[] };
  if (!Array.isArray(cards)) {
    res.status(400).json({ error: 'cards 배열이 필요합니다.' });
    return;
  }
  const score = structuralScore(cards);
  const { threshold } = getRefineConfig();
  res.json({ completeness: score.completeness, belowThreshold: score.completeness < threshold, missing: score.missing });
});

router.post('/refine', async (req, res, next) => {
  try {
    const { cards, lang, mode } = req.body as { cards: SectionCard[]; lang?: Locale; mode?: 'coach' | 'polish' };
    if (!Array.isArray(cards)) {
      res.status(400).json({ error: 'cards 배열이 필요합니다.' });
      return;
    }
    const cfg = getRefineConfig();
    if (!cfg.model) {
      res.status(409).json({ error: 'no_model' });
      return;
    }
    const score = structuralScore(cards);
    const resolvedMode = mode ?? (score.completeness < cfg.threshold ? 'coach' : 'polish');
    const promptText = buildPrompt(cards);
    const resolvedLang: Locale = LOCALES.includes(lang as Locale) ? (lang as Locale) : 'ko';
    try {
      const assessment = await refineService.assessPrompt({ cfg, promptText, lang: resolvedLang, mode: resolvedMode });
      res.json({ mode: resolvedMode, completeness: score.completeness, available: true, ...assessment });
    } catch (err) {
      res.status(503).json({ error: 'refine_unavailable', available: false, message: (err as Error).message });
    }
  } catch (err) {
    next(err);
  }
});

export default router;
