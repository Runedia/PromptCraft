import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Router } from 'express';

const router = Router();
const DATA_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../../data');
const TREES_DIR = path.join(DATA_DIR, 'trees');
const CARDS_FILE = path.join(DATA_DIR, 'cards', 'card-definitions.json');

router.get('/', async (_req, res, next) => {
  try {
    const files = await fs.readdir(TREES_DIR);
    const trees = await Promise.all(
      files
        .filter((f) => f.endsWith('.json'))
        .map(async (f) => {
          const raw = await fs.readFile(path.join(TREES_DIR, f), 'utf-8');
          const tree = JSON.parse(raw);
          // 목록에서는 카드 배열 제외, 메타만 반환
          return {
            id: tree.id,
            label: tree.label,
            description: tree.description,
            icon: tree.icon,
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
    const treePath = path.join(TREES_DIR, `${treeId}.json`);

    const [treeRaw, cardsRaw] = await Promise.all([fs.readFile(treePath, 'utf-8').catch(() => null), fs.readFile(CARDS_FILE, 'utf-8')]);

    if (!treeRaw) {
      res.status(404).json({ error: `트리를 찾을 수 없습니다: ${treeId}` });
      return;
    }

    const tree = JSON.parse(treeRaw);
    const cardDefs = JSON.parse(cardsRaw);

    res.json({ tree, cardDefs });
  } catch (err) {
    next(err);
  }
});

export default router;
