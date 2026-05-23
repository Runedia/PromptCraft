import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Router } from 'express';
import { cardLoader } from '../card-loader.js';
import { loadRoleMappings } from '../domain-loader.js';

const router = Router();
const DATA_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../../data');
const TREES_DIR = path.join(DATA_DIR, 'trees');

router.get('/', async (_req, res, next) => {
  try {
    const files = await readdir(TREES_DIR);
    const trees = await Promise.all(
      files
        .filter((f) => f.endsWith('.json'))
        .sort((a, b) => a.localeCompare(b))
        .map(async (f) => {
          const tree = await Bun.file(path.join(TREES_DIR, f)).json();
          // 목록에서는 카드 배열 제외, 메타만 반환
          return {
            id: tree.id,
            label: tree.label,
            description: tree.description,
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

    const [tree, cardDefs] = await Promise.all([treeFile.json(), cardLoader.loadCardDefinitions()]);
    const roleMappings = loadRoleMappings();

    res.json({ tree, cardDefs, roleMappings });
  } catch (err) {
    next(err);
  }
});

export default router;
