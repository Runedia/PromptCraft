import { Router } from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const router = Router();
const CARDS_FILE = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../data/cards/card-definitions.json'
);

router.get('/', async (_req, res, next) => {
  try {
    const raw = await fs.readFile(CARDS_FILE, 'utf-8');
    res.json(JSON.parse(raw));
  } catch (err) {
    next(err);
  }
});

export default router;
