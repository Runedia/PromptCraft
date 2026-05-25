import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Router } from 'express';
import { pickText } from '../../shared/i18n/pickLang.js';
import type { I18nText } from '../../shared/i18n/types.js';
import { cardLoader } from '../card-loader.js';
import { loadRoleMappings } from '../domain-loader.js';
import { resolveLang } from '../locale.js';

const router = Router();
const DATA_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../../data');
const TREES_DIR = path.join(DATA_DIR, 'trees');

router.get('/', async (_req, res, next) => {
  try {
    const files = await readdir(TREES_DIR);
    // lang은 요청 단위로 안정적 — Promise.all 콜백마다 재호출(DB read + Intl)하지 않도록 hoist.
    const lang = resolveLang();
    const trees = await Promise.all(
      files
        .filter((f) => f.endsWith('.json'))
        .sort((a, b) => a.localeCompare(b))
        .map(async (f) => {
          const tree = (await Bun.file(path.join(TREES_DIR, f)).json()) as { id: string; label: I18nText; description: I18nText };
          // 목록에서는 카드 배열 제외, 메타만 반환
          return {
            id: tree.id,
            label: pickText(tree.label, lang),
            description: pickText(tree.description, lang),
          };
        })
    );
    res.json(trees);
  } catch (err) {
    next(err);
  }
});

router.get('/:treeId', async (req, res, next) => {
  try {
    const { treeId } = req.params;
    const treeFile = Bun.file(path.join(TREES_DIR, `${treeId}.json`));

    if (!(await treeFile.exists())) {
      res.status(404).json({ error: `트리를 찾을 수 없습니다: ${treeId}` });
      return;
    }

    const [rawTree, cardDefs] = await Promise.all([
      treeFile.json() as Promise<Record<string, unknown> & { label: I18nText; description: I18nText }>,
      cardLoader.loadCardDefinitions(),
    ]);
    const roleMappings = loadRoleMappings();
    const lang = resolveLang();

    // label/description는 display용이므로 해소된 string으로 변환. roleSuffix는 createCardSession 내부에서 lang과 함께 해소되므로 I18nText 유지.
    const tree = {
      ...rawTree,
      label: pickText(rawTree.label, lang),
      description: pickText(rawTree.description, lang),
    };

    res.json({ tree, cardDefs, roleMappings });
  } catch (err) {
    next(err);
  }
});

export default router;
